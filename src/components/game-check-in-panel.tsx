"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { GameTeam } from "@/lib/supabase/database.types";
import {
  canCompareCheckInProximity,
  distanceInMeters,
  isCheckInFresh,
  parseMtrStations,
} from "@/lib/game-check-ins.mjs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const REFRESH_INTERVAL_MILLISECONDS = 15 * 1000;

type Station = {
  code: string;
  latitude: number;
  longitude: number;
  name: string;
};

type CheckIn = {
  checked_in_at: string;
  game_id: string;
  station_code: string;
  team: GameTeam;
  user_id: string;
};

type SeekerMember = {
  displayName: string;
  userId: string;
};

type GameCheckInPanelProps = {
  gameId: string;
  isGameComplete: boolean;
  players: SeekerMember[];
  team: GameTeam;
  userId: string;
};

function formatCheckInAge(checkedInAt: string, now: number) {
  const timestamp = new Date(checkedInAt).getTime();
  if (!Number.isFinite(timestamp)) {
    return { isFresh: false, label: "Timestamp unavailable" };
  }

  const ageMilliseconds = Math.max(0, now - timestamp);
  const ageMinutes = Math.floor(ageMilliseconds / 60_000);
  const label =
    ageMinutes === 0
      ? "Just now"
      : `${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} ago`;

  return {
    isFresh: isCheckInFresh(checkedInAt, now),
    label,
  };
}

export function GameCheckInPanel({
  gameId,
  isGameComplete,
  players,
  team,
  userId,
}: GameCheckInPanelProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedStationCode, setSelectedStationCode] = useState("");
  const [hidingRadiusMeters, setHidingRadiusMeters] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [stationError, setStationError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(0);

  const loadCheckIns = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError("");
      const supabase = createSupabaseBrowserClient();
      const checkInsPromise = supabase
        .from("game_checkins")
        .select("game_id, user_id, team, station_code, checked_in_at")
        .eq("game_id", gameId)
        .order("checked_in_at", { ascending: false });
      const settingsPromise =
        team === "hiders"
          ? supabase
              .from("game_settings")
              .select("final_hiding_radius_meters")
              .eq("game_id", gameId)
              .single()
          : Promise.resolve(null);
      const [checkInsResult, settingsResult] = await Promise.all([
        checkInsPromise,
        settingsPromise,
      ]);
      setIsLoading(false);

      if (checkInsResult.error) {
        setError(checkInsResult.error.message);
        return;
      }
      if (settingsResult && settingsResult.error) {
        setError(settingsResult.error.message);
        return;
      }

      setCheckIns(checkInsResult.data);
      if (settingsResult?.data) {
        setHidingRadiusMeters(settingsResult.data.final_hiding_radius_meters);
      }
    },
    [gameId, team],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/data/mtr-osm.geojson", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`MTR station data could not be loaded (${response.status}).`);
        }
        return parseMtrStations(await response.json());
      })
      .then(setStations)
      .catch((stationError: unknown) => {
        if (
          stationError instanceof Error &&
          stationError.name === "AbortError"
        ) {
          return;
        }
        setStationError(
          stationError instanceof Error
            ? stationError.message
            : "MTR station data could not be loaded.",
        );
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadCheckIns(true));
    queueMicrotask(() => setNow(Date.now()));
    const refreshInterval = window.setInterval(
      () => void loadCheckIns(),
      REFRESH_INTERVAL_MILLISECONDS,
    );
    const clockInterval = window.setInterval(
      () => setNow(Date.now()),
      30 * 1000,
    );

    return () => {
      window.clearInterval(refreshInterval);
      window.clearInterval(clockInterval);
    };
  }, [loadCheckIns]);

  const stationByCode = useMemo(
    () => new Map(stations.map((station) => [station.code, station])),
    [stations],
  );
  const latestCheckIn = useMemo(() => {
    const latestByPlayer = new Map<string, CheckIn>();
    for (const checkIn of checkIns) {
      if (!latestByPlayer.has(checkIn.user_id)) {
        latestByPlayer.set(checkIn.user_id, checkIn);
      }
    }
    return latestByPlayer;
  }, [checkIns]);
  const latestHiderCheckIn = checkIns.find(
    (checkIn) => checkIn.team === "hiders",
  );
  const myCheckIn = latestCheckIn.get(userId);
  const myCheckInAge =
    myCheckIn && now > 0
      ? formatCheckInAge(myCheckIn.checked_in_at, now)
      : null;
  const latestHiderCheckInAge =
    latestHiderCheckIn && now > 0
      ? formatCheckInAge(latestHiderCheckIn.checked_in_at, now)
      : null;
  const seekerLocations = useMemo(
    () =>
      players.map((player) => ({
        player,
        checkIn: latestCheckIn.get(player.userId),
      })),
    [latestCheckIn, players],
  );
  const hiderStation = latestHiderCheckIn
    ? stationByCode.get(latestHiderCheckIn.station_code)
    : undefined;
  const proximity = useMemo(() => {
    if (
      now <= 0 ||
      !latestHiderCheckIn ||
      !hiderStation ||
      hidingRadiusMeters === null
    ) {
      return null;
    }

    return seekerLocations.map(({ player, checkIn }) => {
      const station = checkIn
        ? stationByCode.get(checkIn.station_code)
        : undefined;
      const isCurrent =
        checkIn !== undefined &&
        canCompareCheckInProximity(
          latestHiderCheckIn.checked_in_at,
          checkIn.checked_in_at,
          now,
        );
      return {
        displayName: player.displayName,
        isFresh: isCurrent,
        distanceMeters:
          station && isCurrent ? distanceInMeters(hiderStation, station) : null,
      };
    });
  }, [
    hidingRadiusMeters,
    hiderStation,
    latestHiderCheckIn,
    now,
    seekerLocations,
    stationByCode,
  ]);

  async function submitCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const selectedStation = stationByCode.get(selectedStationCode);
    if (!selectedStation) {
      setError("Choose an MTR station before checking in.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: submitError } = await supabase.rpc("submit_station_checkin", {
      target_game_id: gameId,
      target_station_code: selectedStation.code,
    });
    setIsSubmitting(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    setSelectedStationCode("");
    await loadCheckIns(true);
  }

  const headingId = `game-check-in-heading-${team}`;

  return (
    <section className="game-check-in-panel" aria-labelledby={headingId}>
      <div className="round-dashboard-heading">
        <div>
          <p className="eyebrow">Manual station check-in</p>
          <h2 id={headingId}>
            {team === "seekers" ? "Report your station." : "Hider zone station."}
          </h2>
        </div>
        <button
          className="text-button"
          disabled={isLoading}
          type="button"
          onClick={() => void loadCheckIns(true)}
        >
          Refresh
        </button>
      </div>
      <p>
        Check-ins are submitted by choosing an MTR station. No GPS or automatic
        location collection is used. Reports are self-reported, not verified.
        The latest report stays visible after it becomes stale.
      </p>
      {error && (
        <p className="board-error" role="alert">
          {error}
        </p>
      )}
      {stationError && (
        <p className="board-error" role="alert">
          {stationError}
        </p>
      )}
      <form className="game-check-in-form" onSubmit={submitCheckIn}>
        <label htmlFor={`check-in-station-${team}`}>MTR station</label>
        <select
          id={`check-in-station-${team}`}
          disabled={isGameComplete || isSubmitting || stations.length === 0}
          required
          value={selectedStationCode}
          onChange={(event) => setSelectedStationCode(event.target.value)}
        >
          <option value="">Choose a station</option>
          {stations.map((station) => (
            <option key={station.code} value={station.code}>
              {station.name} ({station.code})
            </option>
          ))}
        </select>
        <button
          className="button button-primary"
          disabled={isGameComplete || isSubmitting || stations.length === 0}
          type="submit"
        >
          {isSubmitting ? "Saving check-in..." : "Check in at station"}
        </button>
      </form>
      {isGameComplete && (
        <p role="status">This game is complete; new check-ins are closed.</p>
      )}
      <p className="game-check-in-attribution">
        Station data: ©{" "}
        <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">
          OpenStreetMap contributors
        </a>{" "}
        (ODbL 1.0).
      </p>

      {team === "seekers" ? (
        <div className="game-check-in-latest" aria-live="polite">
          <h3>Your latest station</h3>
          {isLoading ? (
            <p className="board-loading">Loading your latest check-in...</p>
          ) : myCheckIn ? (
            <p>
              <strong>
                {stationByCode.get(myCheckIn.station_code)?.name ??
                  "Station not in current MTR data"}
              </strong>{" "}
              ({myCheckIn.station_code}) ·{" "}
              {myCheckInAge && (
                <span
                  className={
                    myCheckInAge.isFresh ? "check-in-fresh" : "check-in-stale"
                  }
                >
                  {myCheckInAge.isFresh ? "Fresh" : "Stale"} ·{" "}
                  {myCheckInAge.label}
                </span>
              )}
            </p>
          ) : (
            <p>No station check-in yet.</p>
          )}
          <p>Hiders can see this report and its age.</p>
        </div>
      ) : (
        <>
          <div className="game-check-in-latest" aria-live="polite">
            <h3>Current hiding-zone station</h3>
            <p>
              The newest Hider Team station check-in sets the center of the
              configured {hidingRadiusMeters ?? "—"} m radius. This location is
              visible only to Hiders.
            </p>
            {isLoading ? (
              <p className="board-loading">Loading Hider Team check-ins...</p>
            ) : latestHiderCheckIn ? (
              <p>
                <strong>
                  {stationByCode.get(latestHiderCheckIn.station_code)?.name ??
                    "Station not in current MTR data"}
                </strong>{" "}
                ({latestHiderCheckIn.station_code}) ·{" "}
                {latestHiderCheckInAge && (
                  <span
                    className={
                      latestHiderCheckInAge.isFresh
                        ? "check-in-fresh"
                        : "check-in-stale"
                    }
                  >
                    {latestHiderCheckInAge.isFresh ? "Fresh" : "Stale"} ·{" "}
                    {latestHiderCheckInAge.label}
                  </span>
                )}
              </p>
            ) : (
              <p>No optional Hider station has been set.</p>
            )}
          </div>
          <div className="game-check-in-seekers">
            <h3>Latest Seeker stations</h3>
            {isLoading ? (
              <p className="board-loading">Loading Seeker check-ins...</p>
            ) : seekerLocations.length > 0 ? (
              <ul>
                {seekerLocations.map(({ player, checkIn }) => {
                  const age = checkIn
                    ? formatCheckInAge(checkIn.checked_in_at, now)
                    : null;
                  const proximityToStation =
                    checkIn && hiderStation
                      ? stationByCode.get(checkIn.station_code)
                      : undefined;
                  const distance =
                    proximityToStation && hiderStation
                      ? distanceInMeters(hiderStation, proximityToStation)
                      : null;

                  return (
                    <li key={player.userId}>
                      <strong>{player.displayName}</strong>
                      {checkIn ? (
                        <>
                          <span>
                            {stationByCode.get(checkIn.station_code)?.name ??
                              "Station not in current MTR data"}{" "}
                            ({checkIn.station_code})
                          </span>
                          <span className={age?.isFresh ? "check-in-fresh" : "check-in-stale"}>
                            {age?.isFresh ? "Fresh" : "Stale"} · {age?.label}
                          </span>
                          {distance !== null &&
                            hidingRadiusMeters !== null &&
                            latestHiderCheckInAge?.isFresh && (
                              <span>
                                {age?.isFresh
                                  ? distance <= hidingRadiusMeters
                                    ? `Within ${hidingRadiusMeters} m of the Hider station`
                                    : `Outside the ${hidingRadiusMeters} m radius`
                                  : `Last report ${
                                      distance <= hidingRadiusMeters
                                        ? "was within"
                                        : "was outside"
                                    } the ${hidingRadiusMeters} m radius; check in again to confirm`}
                              </span>
                            )}
                        </>
                      ) : (
                        <span>No station check-in yet</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No assigned Seekers are listed.</p>
            )}
            {proximity?.some(
              (entry) =>
                entry.distanceMeters !== null &&
                entry.isFresh &&
                hidingRadiusMeters !== null &&
                entry.distanceMeters <= hidingRadiusMeters,
            ) && (
              <p className="check-in-proximity-alert" role="status">
                A fresh Seeker check-in is within the hiding radius. This is
                based on the reported station; the host remains in control of
                phase changes.
              </p>
            )}
            {latestHiderCheckIn &&
              now > 0 &&
              (!latestHiderCheckInAge?.isFresh ||
                !hiderStation ||
                seekerLocations.some(
                  ({ checkIn }) =>
                    checkIn && !stationByCode.has(checkIn.station_code),
                )) && (
                  <p role="status">
                    {!latestHiderCheckInAge?.isFresh
                      ? "The Hider station report is stale; update it before using proximity alerts."
                      : "Proximity cannot be checked for a station missing from the current MTR snapshot."}
                  </p>
                )}
          </div>
        </>
      )}
    </section>
  );
}
