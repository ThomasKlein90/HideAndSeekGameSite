const JOIN_ERROR_MESSAGES = new Map([
  [
    "No game matches that join code.",
    "We couldn't find a game with that code. Check it with the host and try again.",
  ],
  [
    "This game already has four players.",
    "This game is full and cannot accept another player. Ask the host for help.",
  ],
]);

const NETWORK_ERROR_PATTERN =
  /failed to fetch|fetch failed|network(?: request)? failed|networkerror|network error|load failed|unable to connect/i;

/**
 * @param {{ message?: unknown; name?: unknown } | null | undefined} error
 */
export function formatGameJoinError(error) {
  const message =
    error && typeof error.message === "string" ? error.message.trim() : "";

  if (message) {
    const joinMessage = JOIN_ERROR_MESSAGES.get(message);
    if (joinMessage) {
      return joinMessage;
    }

    if (
      NETWORK_ERROR_PATTERN.test(message) ||
      (typeof error?.name === "string" &&
        /^authretryablefetcherror$/i.test(error.name))
    ) {
      return "Couldn't connect to the game service. Check your internet connection and try again.";
    }

    return message;
  }

  return "We couldn't join the game. Please try again.";
}
