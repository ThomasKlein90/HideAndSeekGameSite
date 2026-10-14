"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  parseLocalDateTimeInput,
  toLocalDateTimeInput,
} from "@/lib/game-check-in-corrections.mjs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const REFRESH_INTERVAL_MILLISECONDS = 15 * 1000;

type Station = {
  code: string;
  name: string;
};

type CheckIn = {
  checked_in_at: string;
  game_id: string;
  station_code: string;
  team: "hiders" | "seekers";
  user_id: string;
};

type GamePlayer = {
  displayName: string;
  team: "hiders" | "seekers";
  userId: string;
};

type Correction = {
  actor_id: string;
  corrected_checked_in_at: string;
  corrected_station_code: string;
  created_at: string;
  game_id: string;
  id: string;
  previous_checked_in_at: string;
  previous_station_code: string;
  user_id: string;
};

type CheckInCorrectionPanelProps = {
  checkIns: CheckIn[];
  gameId: string;
  gameIsComplete: boolean;
  hostName: string;
  onCorrected: () => Promise<void>;
  players: GamePlayer[];
  stations: Station[];
};

function formatDateTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString()
    : "Time unavailable";
}

export function GameCheckInCorrectionPanel({
  checkIns,
  gameId,
  gameIsComplete,
  hostName,
  onCorrected,
  players,
  stations,
}: CheckInCorrectionPanelProps) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [drafts, setDrafts] = useState<
    Record<string, { stationCode: string; checkedInAt: string }>
  >({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState("");

  const loadCorrections = useCallback(async () => {
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { data, error: loadError } = await supabase
      .from("game_checkin_corrections")
      .select(
        "id, game_id, user_id, actor_id, previous_station_code, corrected_station_code, previous_checked_in_at, corrected_checked_in_at, created_at",
      )
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    setIsLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setCorrections(data);
  }, [gameId]);

  useEffect(() => {
    queueMicrotask(() => void loadCorrections());
    const interval = window.setInterval(
      () => void loadCorrections(),
      REFRESH_INTERVAL_MILLISECONDS,
    );
    return () => window.clearInterval(interval);
  }, [loadCorrections]);

  const playerById = new Map(players.map((player) => [player.userId, player]));
  const stationByCode = new Map(stations.map((station) => [station.code, station]));
  const correctionsByPlayer = new Map<string, Correction[]>();
  for (const correction of corrections) {
    const playerCorrections = correctionsByPlayer.get(correction.user_id) ?? [];
    playerCorrections.push(correction);
    correctionsByPlayer.set(correction.user_id, playerCorrections);
  }

  async function submitCorrection(
    event: FormEvent<HTMLFormElement>,
    checkIn: CheckIn,
  ) {
    event.preventDefault();
    setError("");
    setStatus("");

    const draft = drafts[checkIn.user_id] ?? {
      stationCode: checkIn.station_code,
      checkedInAt: toLocalDateTimeInput(checkIn.checked_in_at),
    };
    const timestamp = parseLocalDateTimeInput(draft.checkedInAt);
    if (!stationByCode.has(draft.stationCode) || !timestamp) {
      setError("Choose a valid MTR station and report time.");
      return;
    }
    const correctedTimestamp =
      new Date(timestamp).getTime() ===
      new Date(checkIn.checked_in_at).getTime()
        ? checkIn.checked_in_at
        : timestamp;

    setSavingUserId(checkIn.user_id);
    const supabase = createSupabaseBrowserClient();
    const { error: correctionError } = await supabase.rpc(
      "correct_station_checkin",
      {
        target_game_id: gameId,
        target_user_id: checkIn.user_id,
        target_station_code: draft.stationCode,
        target_checked_in_at: correctedTimestamp,
      },
    );
    setSavingUserId("");

    if (correctionError) {
      setError(correctionError.message);
      return;
    }

    setDrafts((current) => {
      const next = { ...current };
      delete next[checkIn.user_id];
      return next;
    });
    setStatus("Check-in correction saved.");
    await Promise.all([onCorrected(), loadCorrections()]);
  }

  return (
    <section
      className="game-check-in-corrections"
      aria-labelledby="game-check-in-corrections-heading"
    >
      <div className="round-dashboard-heading">
        <div>
          <p className="eyebrow">Host controls</p>
          <h3 id="game-check-in-corrections-heading">Correct check-ins</h3>
        </div>
      </div>
      <p>
        Corrections update the current report. The previous and corrected
        station and report time remain in host-only history.
      </p>
      {gameIsComplete && (
        <p role="status">This game is complete; check-ins can no longer be corrected.</p>
      )}
      {error && (
        <p className="board-error" role="alert">
          {error}
        </p>
      )}
      {status && <p role="status">{status}</p>}

      {checkIns.length > 0 ? (
        <ul className="game-check-in-correction-list">
          {checkIns.map((checkIn) => {
            const player = playerById.get(checkIn.user_id);
            const draft = drafts[checkIn.user_id] ?? {
              stationCode: checkIn.station_code,
              checkedInAt: toLocalDateTimeInput(checkIn.checked_in_at),
            };
            const parsedDraft = parseLocalDateTimeInput(draft.checkedInAt);
            const isUnchanged =
              draft.stationCode === checkIn.station_code &&
              parsedDraft !== null &&
              new Date(parsedDraft).getTime() ===
                new Date(checkIn.checked_in_at).getTime();

            return (
              <li key={checkIn.user_id}>
                <h4>
                  {player?.displayName ?? "Player"} · {checkIn.team}
                </h4>
                <p>
                  Current:{" "}
                  {stationByCode.get(checkIn.station_code)?.name ??
                    checkIn.station_code}{" "}
                  ({checkIn.station_code}) · {formatDateTime(checkIn.checked_in_at)}
                </p>
                <form
                  className="game-check-in-correction-form"
                  onSubmit={(event) => void submitCorrection(event, checkIn)}
                >
                  <label htmlFor={`correct-station-${checkIn.user_id}`}>
                    Correct station
                  </label>
                  <select
                    disabled={gameIsComplete || savingUserId !== ""}
                    id={`correct-station-${checkIn.user_id}`}
                    required
                    value={draft.stationCode}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [checkIn.user_id]: {
                          ...draft,
                          stationCode: event.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">Choose a station</option>
                    {stations.map((station) => (
                      <option key={station.code} value={station.code}>
                        {station.name} ({station.code})
                      </option>
                    ))}
                  </select>
                  <label htmlFor={`correct-time-${checkIn.user_id}`}>
                    Correct reported time
                  </label>
                  <input
                    disabled={gameIsComplete || savingUserId !== ""}
                    id={`correct-time-${checkIn.user_id}`}
                    max={toLocalDateTimeInput(new Date().toISOString())}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [checkIn.user_id]: {
                          ...draft,
                          checkedInAt: event.target.value,
                        },
                      }))
                    }
                    required
                    step="0.001"
                    type="datetime-local"
                    value={draft.checkedInAt}
                  />
                  <button
                    className="button button-secondary"
                    disabled={
                      gameIsComplete ||
                      savingUserId !== "" ||
                      stations.length === 0 ||
                      isUnchanged
                    }
                    type="submit"
                  >
                    {savingUserId === checkIn.user_id
                      ? "Saving correction..."
                      : "Save correction"}
                  </button>
                </form>
                <details>
                  <summary>
                    Correction history (
                    {correctionsByPlayer.get(checkIn.user_id)?.length ?? 0})
                  </summary>
                  {(correctionsByPlayer.get(checkIn.user_id) ?? []).length > 0 ? (
                    <ol>
                      {(correctionsByPlayer.get(checkIn.user_id) ?? []).map(
                        (correction) => (
                          <li key={correction.id}>
                            <p>
                              {hostName} · corrected{" "}
                              {formatDateTime(correction.created_at)}
                            </p>
                            <p>
                              {stationByCode.get(correction.previous_station_code)
                                ?.name ?? correction.previous_station_code}{" "}
                              at {formatDateTime(correction.previous_checked_in_at)}
                              {" → "}
                              {stationByCode.get(correction.corrected_station_code)
                                ?.name ?? correction.corrected_station_code}{" "}
                              at{" "}
                              {formatDateTime(correction.corrected_checked_in_at)}
                            </p>
                          </li>
                        ),
                      )}
                    </ol>
                  ) : (
                    <p>No corrections recorded.</p>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No player check-ins are available to correct.</p>
      )}
      {isLoading && <p className="board-loading">Loading correction history...</p>}
    </section>
  );
}
