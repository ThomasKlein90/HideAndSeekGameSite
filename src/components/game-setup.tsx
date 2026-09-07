"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { SeekerQuestionBoard } from "@/components/seeker-question-board";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CreatedGame = {
  id: string;
  name: string;
  join_code: string;
  phase: string;
};

type GamePlayer = {
  user_id: string;
  team: "hiders" | "seekers";
  role: "host" | "player";
  is_team_assigned: boolean;
  profiles: {
    display_name: string;
  } | null;
};

export function GameSetup() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gameName, setGameName] = useState("Hong Kong Hide and Seek");
  const [headStartMinutes, setHeadStartMinutes] = useState("15");
  const [radiusMeters, setRadiusMeters] = useState("500");
  const [hostTeam, setHostTeam] = useState<"hiders" | "seekers">("seekers");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"host" | "join">("host");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGame, setCreatedGame] = useState<CreatedGame | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isGameHost, setIsGameHost] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<"hiders" | "seekers" | null>(
    null,
  );

  useEffect(() => {
    if (!session) {
      setDisplayName("");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    void supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error: profileError }) => {
        if (profileError) {
          setError(profileError.message);
          return;
        }

        setDisplayName(data.display_name);
      });
  }, [session]);

  async function loadPlayers(gameId: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error: playersError } = await supabase
      .from("game_players")
      .select("user_id, team, role, is_team_assigned, profiles(display_name)")
      .eq("game_id", gameId)
      .order("created_at");

    if (playersError) {
      setError(playersError.message);
      return;
    }

    setPlayers(data as GamePlayer[]);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendSignInLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setStatus("Check your email for a secure sign-in link.");
  }

  async function saveDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    const nextDisplayName = displayName.trim();

    if (nextDisplayName.length < 1 || nextDisplayName.length > 50) {
      setError("Display name must be between 1 and 50 characters.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: nextDisplayName })
      .eq("id", session?.user.id ?? "");
    setIsSubmitting(false);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setDisplayName(nextDisplayName);
    setStatus("Display name updated.");
  }

  async function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setCreatedGame(null);

    const parsedHeadStartMinutes = Number(headStartMinutes);
    const parsedRadiusMeters = Number(radiusMeters);

    if (
      !Number.isInteger(parsedHeadStartMinutes) ||
      parsedHeadStartMinutes < 0 ||
      parsedHeadStartMinutes > 120
    ) {
      setError("Head start must be a whole number from 0 to 120 minutes.");
      return;
    }

    if (
      !Number.isInteger(parsedRadiusMeters) ||
      parsedRadiusMeters < 25 ||
      parsedRadiusMeters > 5000
    ) {
      setError("Final hiding radius must be a whole number from 25 to 5,000 metres.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: createError } = await supabase.rpc("create_game", {
      game_name: gameName,
      host_team: hostTeam,
      hider_head_start_seconds: parsedHeadStartMinutes * 60,
      final_hiding_radius_meters: parsedRadiusMeters,
    });
    setIsSubmitting(false);

    if (createError) {
      setError(createError.message);
      return;
    }

    const game = data?.[0] as CreatedGame | undefined;

    if (!game) {
      setError("The game was created but no game details were returned.");
      return;
    }

    setCreatedGame(game);
    setIsGameHost(true);
    setCurrentTeam(hostTeam);
    void loadPlayers(game.id);
  }

  async function joinGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setCreatedGame(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: joinError } = await supabase.rpc("join_game", {
      game_join_code: joinCode,
    });
    setIsSubmitting(false);

    if (joinError) {
      setError(joinError.message);
      return;
    }

    const game = data?.[0] as CreatedGame | undefined;

    if (!game) {
      setError("The game was joined but no game details were returned.");
      return;
    }

    setCreatedGame(game);
    setIsGameHost(false);
    setCurrentTeam(null);
    setStatus("You joined the game. The host will assign your team.");
  }

  async function assignTeam(player: GamePlayer, team: "hiders" | "seekers") {
    if (!createdGame) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: assignmentError } = await supabase.rpc("assign_player_team", {
      target_game_id: createdGame.id,
      target_user_id: player.user_id,
      selected_team: team,
    });
    setIsSubmitting(false);

    if (assignmentError) {
      setError(assignmentError.message);
      return;
    }

    await loadPlayers(createdGame.id);
  }

  async function signOut() {
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
    }
  }

  return (
    <section className="game-setup" id="getting-started" aria-labelledby="setup-heading">
      <div className="setup-intro">
        <p className="eyebrow">Game setup</p>
        <h2 id="setup-heading">Start the host&apos;s game board.</h2>
        <p>
          Sign in with email to create a private game. You will receive a
          shareable join code for the other three players.
        </p>
      </div>

      {!session ? (
        <form className="setup-card" onSubmit={sendSignInLink}>
          <h3>Sign in to host</h3>
          <p>We use passwordless email links so no new password is needed.</p>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button className="button button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending link..." : "Send sign-in link"}
          </button>
        </form>
      ) : (
        <div className="setup-card">
          <div className="signed-in-row">
            <div>
              <h3>Host setup</h3>
              <p>Signed in as {session.user.email}</p>
            </div>
            <button className="text-button" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
          <form className="nested-form" onSubmit={saveDisplayName}>
            <label htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              maxLength={50}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
            <button className="button button-secondary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving name..." : "Save display name"}
            </button>
          </form>
          <div className="mode-switch" aria-label="Game action">
            <button
              aria-pressed={mode === "host"}
              className={mode === "host" ? "mode-button is-active" : "mode-button"}
              type="button"
              onClick={() => setMode("host")}
            >
              Host a game
            </button>
            <button
              aria-pressed={mode === "join"}
              className={mode === "join" ? "mode-button is-active" : "mode-button"}
              type="button"
              onClick={() => setMode("join")}
            >
              Join a game
            </button>
          </div>
          {mode === "host" ? (
            <form className="nested-form" onSubmit={createGame}>
          <label htmlFor="game-name">Game name</label>
          <input
            id="game-name"
            maxLength={100}
            value={gameName}
            onChange={(event) => setGameName(event.target.value)}
            required
          />
          <div className="field-pair">
            <div>
              <label htmlFor="head-start">Hider head start (minutes)</label>
              <input
                id="head-start"
                inputMode="numeric"
                min="0"
                max="120"
                type="number"
                value={headStartMinutes}
                onChange={(event) => setHeadStartMinutes(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="hiding-radius">Final hiding radius (metres)</label>
              <input
                id="hiding-radius"
                inputMode="numeric"
                min="25"
                max="5000"
                type="number"
                value={radiusMeters}
                onChange={(event) => setRadiusMeters(event.target.value)}
                required
              />
            </div>
          </div>
          <fieldset className="team-choice">
            <legend>Your starting team</legend>
            <label>
              <input
                checked={hostTeam === "hiders"}
                name="host-team"
                type="radio"
                value="hiders"
                onChange={() => setHostTeam("hiders")}
              />
              Hiders
            </label>
            <label>
              <input
                checked={hostTeam === "seekers"}
                name="host-team"
                type="radio"
                value="seekers"
                onChange={() => setHostTeam("seekers")}
              />
              Seekers
            </label>
          </fieldset>
          <button className="button button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating game..." : "Create game"}
          </button>
            </form>
          ) : (
            <form className="nested-form" onSubmit={joinGame}>
              <label htmlFor="join-code">Game join code</label>
              <input
                id="join-code"
                autoCapitalize="characters"
                maxLength={6}
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                required
              />
              <button className="button button-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Joining game..." : "Join game"}
              </button>
            </form>
          )}
        </div>
      )}

      {(status || error) && (
        <p className={error ? "form-message form-error" : "form-message"} role="status">
          {error || status}
        </p>
      )}

      {createdGame && (
        <div className="created-game" role="status">
          <p className="eyebrow">Game created</p>
          <h3>{createdGame.name}</h3>
          <p>Share this join code with your players.</p>
          <strong>{createdGame.join_code}</strong>
          {isGameHost && (
            <div className="player-roster">
              <h4>Team assignment</h4>
              <p>Assign each joining player to a team. Each team has two places.</p>
              {players.map((player) => (
                <div className="roster-player" key={player.user_id}>
                  <div>
                    <strong>{player.profiles?.display_name ?? "Player"}</strong>
                    <span>
                      {player.role === "host"
                        ? `Host · ${player.team}`
                        : player.is_team_assigned
                          ? player.team
                          : "Waiting for team"}
                    </span>
                  </div>
                  {player.role === "player" && (
                    <div className="team-buttons">
                      <button
                        disabled={isSubmitting}
                        type="button"
                        onClick={() => assignTeam(player, "hiders")}
                      >
                        Hiders
                      </button>
                      <button
                        disabled={isSubmitting}
                        type="button"
                        onClick={() => assignTeam(player, "seekers")}
                      >
                        Seekers
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {createdGame && currentTeam === "seekers" && <SeekerQuestionBoard />}
    </section>
  );
}
