"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { GamePhase } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GameRoundDashboardProps = {
  gameId: string;
  isHost: boolean;
  canEditReferencePoint: boolean;
};

type DashboardData = {
  phase: GamePhase;
  phaseStartedAt: string | null;
  roundNumber: number | null;
  headStartSeconds: number;
  finalHidingRadiusMeters: number;
  referenceLabel: string | null;
  referenceLatitude: number | null;
  referenceLongitude: number | null;
};

type AuditEntry = {
  id: string;
  action: string;
  from_phase: GamePhase | null;
  to_phase: GamePhase | null;
  created_at: string;
};

const phaseLabels: Record<GamePhase, string> = {
  setup: "Setup",
  hider_head_start: "Hider head start",
  active_seeking: "Active seeking",
  final_hiding: "Final hiding",
  round_complete: "Round complete",
  game_complete: "Game complete",
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function GameRoundDashboard({
  gameId,
  isHost,
  canEditReferencePoint,
}: GameRoundDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [referenceLatitude, setReferenceLatitude] = useState("");
  const [referenceLongitude, setReferenceLongitude] = useState("");
  const [isSavingReference, setIsSavingReference] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError("");
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const [gameResult, roundResult, settingsResult, auditResult] = await Promise.all([
      supabase
        .from("games")
        .select("phase, phase_started_at")
        .eq("id", gameId)
        .single(),
      supabase
        .from("rounds")
        .select("number")
        .eq("game_id", gameId)
        .is("ended_at", null)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("game_settings")
        .select(
          "hider_head_start_seconds, final_hiding_radius_meters, final_hiding_reference_label, final_hiding_reference_latitude, final_hiding_reference_longitude",
        )
        .eq("game_id", gameId)
        .single(),
      supabase
        .from("game_audit_log")
        .select("id, action, from_phase, to_phase, created_at")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    setIsLoading(false);

    const loadError =
      gameResult.error ??
      roundResult.error ??
      settingsResult.error ??
      auditResult.error;
    if (loadError || !gameResult.data || !settingsResult.data) {
      setError(loadError?.message ?? "The game dashboard could not be loaded.");
      return;
    }

    setData({
      phase: gameResult.data.phase,
      phaseStartedAt: gameResult.data.phase_started_at,
      roundNumber: roundResult.data?.number ?? null,
      headStartSeconds: settingsResult.data.hider_head_start_seconds,
      finalHidingRadiusMeters: settingsResult.data.final_hiding_radius_meters,
      referenceLabel: settingsResult.data.final_hiding_reference_label,
      referenceLatitude: settingsResult.data.final_hiding_reference_latitude,
      referenceLongitude: settingsResult.data.final_hiding_reference_longitude,
    });
    setReferenceLabel(settingsResult.data.final_hiding_reference_label ?? "");
    setReferenceLatitude(
      settingsResult.data.final_hiding_reference_latitude?.toString() ?? "",
    );
    setReferenceLongitude(
      settingsResult.data.final_hiding_reference_longitude?.toString() ?? "",
    );
    setAuditEntries((auditResult.data ?? []) as AuditEntry[]);
  }, [gameId]);

  async function saveReferencePoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const label = referenceLabel.trim();
    const hasLatitude = referenceLatitude.trim() !== "";
    const hasLongitude = referenceLongitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      setError("Enter both a latitude and longitude, or leave both blank.");
      return;
    }

    const latitude = hasLatitude ? Number(referenceLatitude) : null;
    const longitude = hasLongitude ? Number(referenceLongitude) : null;

    if (
      (latitude !== null &&
        (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setError("Latitude must be -90 to 90 and longitude must be -180 to 180.");
      return;
    }

    setIsSavingReference(true);
    const supabase = createSupabaseBrowserClient();
    const { error: saveError } = await supabase.rpc(
      "set_final_hiding_reference_point",
      {
        target_game_id: gameId,
        reference_label: label || null,
        reference_latitude: latitude,
        reference_longitude: longitude,
      },
    );
    setIsSavingReference(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    await loadDashboard();
  }

  async function transitionPhase(nextPhase: GamePhase) {
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: transitionError } = await supabase.rpc(
      "transition_game_phase",
      {
        target_game_id: gameId,
        next_phase: nextPhase,
      },
    );

    if (transitionError) {
      setError(transitionError.message);
      return;
    }

    await loadDashboard();
  }

  useEffect(() => {
    queueMicrotask(() => void loadDashboard());
  }, [loadDashboard]);

  useEffect(() => {
    if (!data?.phaseStartedAt || data.phase !== "hider_head_start") {
      queueMicrotask(() => setRemainingSeconds(null));
      return;
    }

    const updateRemaining = () => {
      const deadline =
        new Date(data.phaseStartedAt as string).getTime() +
        data.headStartSeconds * 1000;
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [data]);

  return (
    <section className="round-dashboard" aria-labelledby="round-dashboard-heading">
      <div className="round-dashboard-heading">
        <div>
          <p className="eyebrow">Game status</p>
          <h2 id="round-dashboard-heading">Round dashboard.</h2>
        </div>
        <button
          className="text-button"
          disabled={isLoading}
          type="button"
          onClick={() => void loadDashboard()}
        >
          Refresh
        </button>
      </div>
      {error && (
        <p className="board-error" role="status">
          {error}
        </p>
      )}
      {!error && isLoading && (
        <p className="board-loading" role="status">
          Loading game status...
        </p>
      )}
      {!error && !isLoading && data && (
        <div className="round-dashboard-grid">
          <div>
            <span>Round</span>
            <strong>{data.roundNumber ?? "—"}</strong>
          </div>
          <div>
            <span>Phase</span>
            <strong>{phaseLabels[data.phase]}</strong>
          </div>
          <div>
            <span>Hider timer</span>
            <strong>
              {remainingSeconds === null
                ? data.phase === "setup"
                  ? "Waiting to start"
                  : "Not active"
                : formatDuration(remainingSeconds)}
            </strong>
          </div>
          <div>
            <span>Final hiding radius</span>
            <strong>{data.finalHidingRadiusMeters} m</strong>
          </div>
        </div>
      )}
      {!error && data && (
        <div className="reference-point-panel">
          <div>
            <span>Final hiding reference point</span>
            <strong>
              {data.referenceLabel ??
                (data.referenceLatitude !== null &&
                data.referenceLongitude !== null
                  ? `${data.referenceLatitude}, ${data.referenceLongitude}`
                  : "Not set")}
            </strong>
            {data.referenceLatitude !== null &&
              data.referenceLongitude !== null && (
                <small>
                  Within {data.finalHidingRadiusMeters} m of this reference.
                </small>
              )}
          </div>
          {canEditReferencePoint && (
            <form className="reference-point-form" onSubmit={saveReferencePoint}>
              <label htmlFor="reference-label">Location label</label>
              <input
                id="reference-label"
                maxLength={150}
                placeholder="e.g. Central station exit"
                value={referenceLabel}
                onChange={(event) => setReferenceLabel(event.target.value)}
              />
              <div className="field-pair">
                <div>
                  <label htmlFor="reference-latitude">Latitude</label>
                  <input
                    id="reference-latitude"
                    inputMode="decimal"
                    placeholder="22.3193"
                    value={referenceLatitude}
                    onChange={(event) => setReferenceLatitude(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="reference-longitude">Longitude</label>
                  <input
                    id="reference-longitude"
                    inputMode="decimal"
                    placeholder="114.1694"
                    value={referenceLongitude}
                    onChange={(event) => setReferenceLongitude(event.target.value)}
                  />
                </div>
              </div>
              <button
                className="button button-secondary"
                disabled={isSavingReference}
                type="submit"
              >
                {isSavingReference ? "Saving point..." : "Save reference point"}
              </button>
            </form>
          )}
        </div>
      )}
      {!error && data && isHost && (
        <div className="phase-controls">
          <span>Host controls</span>
          {data.phase === "setup" && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void transitionPhase("hider_head_start")}
            >
              Start hider head start
            </button>
          )}
          {data.phase === "hider_head_start" && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void transitionPhase("active_seeking")}
            >
              Begin active seeking
            </button>
          )}
          {data.phase === "active_seeking" && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void transitionPhase("final_hiding")}
            >
              Start final hiding
            </button>
          )}
          {data.phase === "final_hiding" && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void transitionPhase("round_complete")}
            >
              Complete round
            </button>
          )}
          {data.phase === "round_complete" && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void transitionPhase("game_complete")}
            >
              End game
            </button>
          )}
        </div>
      )}
      {!error && auditEntries.length > 0 && (
        <div className="audit-log">
          <span>Recent host changes</span>
          <ul>
            {auditEntries.map((entry) => (
              <li key={entry.id}>
                <strong>
                  {entry.from_phase
                    ? `${phaseLabels[entry.from_phase]} → ${phaseLabels[entry.to_phase ?? entry.from_phase]}`
                    : entry.action}
                </strong>
                <time dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
