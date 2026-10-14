"use client";

type SeekerStatusPlayer = {
  userId: string;
  displayName: string;
};

type SeekerStatusPanelProps = {
  isAssigned: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  players: SeekerStatusPlayer[];
  userId: string;
};

export function SeekerStatusPanel({
  isAssigned,
  isLoading,
  onRefresh,
  players,
  userId,
}: SeekerStatusPanelProps) {
  return (
    <section
      className="seeker-status-panel"
      aria-labelledby="seeker-status-heading"
    >
      <div className="round-dashboard-heading">
        <div>
          <p className="eyebrow">Seeker team</p>
          <h2 id="seeker-status-heading">Seeker status.</h2>
        </div>
        <button
          className="text-button"
          disabled={isLoading}
          type="button"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>
      <p role="status">
        {isAssigned
          ? "You are assigned to the Seeker Team."
          : "Your team assignment is waiting for host confirmation."}
      </p>
      <div className="seeker-status-roster">
        <h3>Assigned Seekers ({players.length}/2)</h3>
        {isLoading ? (
          <p className="board-loading">Loading Seeker roster...</p>
        ) : players.length > 0 ? (
          <ul>
            {players.map((player) => (
              <li key={player.userId}>
                {player.displayName}
                {player.userId === userId ? " (you)" : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="board-loading">No Seekers are assigned yet.</p>
        )}
      </div>
      <p className="seeker-status-disclosure">
        This panel shows team assignment only. It does not collect check-ins or
        share anyone&apos;s location.
      </p>
    </section>
  );
}
