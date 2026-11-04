import assert from "node:assert/strict";
import test from "node:test";
import { formatGameJoinError } from "../src/lib/game-errors.mjs";

test("invalid game codes get actionable join guidance", () => {
  assert.equal(
    formatGameJoinError({ message: "No game matches that join code." }),
    "We couldn't find a game with that code. Check it with the host and try again.",
  );
});

test("full games explain why another player cannot join", () => {
  assert.equal(
    formatGameJoinError({ message: "This game already has four players." }),
    "This game is full and cannot accept another player. Ask the host for help.",
  );
});

test("network failures suggest checking connectivity", () => {
  assert.equal(
    formatGameJoinError({ message: "TypeError: Failed to fetch" }),
    "Couldn't connect to the game service. Check your internet connection and try again.",
  );
  assert.equal(
    formatGameJoinError({
      message: "NetworkError when attempting to fetch resource",
    }),
    "Couldn't connect to the game service. Check your internet connection and try again.",
  );
  assert.equal(
    formatGameJoinError({
      message: "Request failed",
      name: "AuthRetryableFetchError",
    }),
    "Couldn't connect to the game service. Check your internet connection and try again.",
  );
});

test("unexpected errors remain visible and missing messages get a clear fallback", () => {
  assert.equal(
    formatGameJoinError({ message: "Database unavailable (503)" }),
    "Database unavailable (503)",
  );
  assert.equal(
    formatGameJoinError(null),
    "We couldn't join the game. Please try again.",
  );
});
