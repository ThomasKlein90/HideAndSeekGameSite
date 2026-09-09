"use client";

import { useCallback, useEffect, useState } from "react";
import type { GamePhase } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GameRoundDashboardProps = {
  gameId: string;
  isHost: boolean;
};

type DashboardData = {
  phase: GamePhase;
  phaseStartedAt: string | null;
  roundNumber: number | null;
  headStartSeconds: number;
  finalHidingRadiusMeters: number;
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

export function GameRoundDashboard({ gameId, isHost }: GameRoundDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
        .select("hider_head_start_seconds, final_hiding_radius_meters")
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
    });
    setAuditEntries((auditResult.data ?? []) as AuditEntry[]);
  }, [gameId]);

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
