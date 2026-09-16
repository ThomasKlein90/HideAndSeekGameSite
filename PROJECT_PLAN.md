# Hide and Seek Hong Kong Companion - Project Plan

This is a living, checkbox-based plan for the private four-player companion
website. Update it as rules and priorities are agreed.

## Product Scope

- [ ] Build a mobile-first website for a two-hiders-versus-two-seekers game in Hong Kong.
- [ ] Support a host/admin, Hider Team, and Seeker Team with role-based views.
- [ ] Provide an accurate, usable game map for Hong Kong transit and geography.
- [ ] Digitize the game workflow without reproducing commercial game materials.

## Confirmed Decisions

- [x] Start with a website rather than a native app.
- [x] Prioritize phone use during live play.
- [x] Start with manual check-ins; defer live-location sharing and automated radius validation.
- [x] Defer push notifications and game replay.
- [x] Use placeholders for structured seeker questions until the group supplies its authorized list.
- [x] Model question rewards as physical-card draws and hand management, not currency.
- [x] Let players join with a shared game code; the host assigns teams after they join.
- [x] Let the host choose whether they begin on the Hider Team or Seeker Team.
- [ ] Confirm the exact question types, card draw/keep rules, and card effects.
- [ ] Confirm the playable Hong Kong boundary and transit restrictions.

## Phase 0 - Foundation

- [x] Choose and initialize the web framework, language, styling, and test tooling.
- [ ] Establish deployment hosting and preview-environment workflow.
- [ ] Set up environment-variable handling and separate local/production configuration.
- [x] Create the responsive application shell and mobile navigation.
- [x] Establish the Supabase authentication and database foundation; implement the user-facing flow next.

## Phase 1 - Game Setup and Access Control

- [x] Create the initial data models and row-level access policies for games, players, teams, settings, and rounds.
- [x] Build the admin game-creation flow.
- [x] Support exactly two Hider Team members and two Seeker Team members for the initial format.
- [x] Build the game-code join flow and add player display-name editing.
- [x] Restore active game sessions on page reload and allow switching/leaving games.
- [x] Add password-based email login option alongside magic links for hosts and recurring players.
- [ ] Implement role-based page access and server-side data authorization.
- [x] Define game phases: setup, hider head start, active seeking, final hiding, round complete, and game complete.
- [x] Add admin controls to start, pause, resume, transition phases, and end a game.
- [x] Record important host changes in an audit trail.

## Phase 2 - Hong Kong Game Map

- [ ] Select appropriately licensed map and geographic-data sources and document attribution.
- [ ] Create a mobile-friendly interactive base map.
- [ ] Add the main MTR routes, stations, and line labels.
- [ ] Add Hong Kong Tramways route and stops where suitable.
- [ ] Add MTR Light Rail routes and stops.
- [ ] Add relevant ferry routes and terminals.
- [ ] Add district boundaries, district labels, island labels, and search.
- [ ] Add independent layer toggles and a clear map legend.
- [ ] Let the admin configure a game boundary and no-go areas.
- [ ] Validate geographic layers visually on phone-sized screens.

## Phase 3 - Seeker Question Board

- [x] Create an editable placeholder question catalogue with category, card-reward rule, answer type, and active status.
- [x] Display the six placeholder seeker categories: Matching, Measuring, Thermometer, Radar, Tentacles, and Photos.
- [x] Define the question-event data model, status values, access policies, and typed database contract.
- [x] Let seekers submit a question after confirmation.
- [x] Deliver pending questions to the Hider Team view.
- [x] Store question status, answers, timestamps, and round history.
- [x] Prevent accidental duplicate submissions while allowing admin corrections.
- [x] Add seeker-only notes, pins, and eliminated-area annotations to the map.

## Phase 4 - Hider Dashboard

- [x] Display current round, phase, and a server-authoritative hiding timer.
- [x] Show incoming questions with clear answer controls.
- [x] Record the selected answer type and submit answer history to seekers.
- [x] Log physical-card rewards received for answering each question.
- [x] Show the Hider Team's current card hand/log, including use and expiry where applicable.
- [x] Display the configured final-hiding radius and a manually selected/reference hiding point.
- [ ] Add a dedicated seeker-status panel ready for future check-ins or consented locations.

## Phase 5 - Manual Check-ins and Operational Reliability

- [ ] Allow permitted players or the admin to record manual district/station check-ins.
- [ ] Display check-in time and freshness clearly to authorized roles.
- [ ] Add admin correction flow that preserves an audit history.
- [ ] Handle reconnects, duplicate actions, and simultaneous updates safely.
- [ ] Add clear network, expired-invite, and invalid-game-state error messages.
- [ ] Test the complete flow with four accounts on real mobile devices.
- [ ] Check core flows for accessibility and one-handed mobile use.

## Later - Only After a Successful Manual-Check-in Game

- [ ] Define consent, visibility, retention, and deletion rules for live location.
- [ ] Add optional role-filtered live-location sharing.
- [ ] Add advisory station-radius and board-boundary checks; retain manual/admin override.
- [ ] Add PWA installation support and consider push notifications.
- [ ] Add post-game timeline and replay features.

## Final Validation Stage - Simulated Game Testing

- [ ] Add a development-only simulation mode that creates a disposable game with
  seeded players, teams, rounds, question events, answers, and reward notes.
- [ ] Provide deterministic controls to advance game phases, submit questions,
  answer them, and complete rounds without requiring four live accounts.
- [ ] Add a reset/cleanup action that removes simulation data and clearly marks
  simulated games so they cannot be mistaken for live games.
- [ ] Document a manual browser walkthrough for entering representative inputs
  and verifying the seeker, hider, host, and round-history views.
- [ ] Use the simulation flow for regression checks before live-device testing.

## Next Session Handoff

The operational resume record is maintained in
[WORKSPACE_HANDOFF.md](./WORKSPACE_HANDOFF.md). Update it at the end of every
session and after each major branch is merged.

Current state:

- [x] Next.js mobile-first application and Supabase project are configured and synchronized.
- [x] Host can sign in by password or magic link, create a game, choose their initial team, and receive a game code.
- [x] Players can sign up / sign in and join by game code; host can assign up to two players per team.
- [x] Server-authoritative phase transitions (`setup` -> `hider_head_start` -> `active_seeking` -> `final_hiding` -> `round_complete` -> `game_complete`) and timers are live with audit trail.
- [x] Seeker Team can submit questions and view answered history; Hider Team receives pending questions, submits answers, and logs physical card rewards.
- [x] Seeker private map annotations and active game session restoration on page reload are fully functional.
- [x] End-to-end multi-role live smoke test passed across host, seeker, and hider roles.

Start next:

1. Phase 4: Implement final-hiding radius display and manually selected/reference hiding point for the Hider dashboard.
2. Phase 2: Begin the Hong Kong interactive map (Leaflet / OpenStreetMap / MTR transit overlays).
3. Confirm group-approved question catalogue and card draw rules.

## Open Decisions

- [ ] Which public-transit modes are allowed for the first game?
- [ ] What makes a final hiding location valid?
- [ ] How will each question type determine the number of physical cards drawn and kept?
- [ ] Which answers require a structured format versus free-text response?
- [ ] Who may correct an answer or resolve a dispute during a game?
- [ ] How long should game data, especially future location data, be retained?
