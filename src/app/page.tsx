import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Hide and Seek Hong Kong home">
          <span className="brand-mark" aria-hidden="true">
            H
          </span>
          <span>
            <strong>Hide and Seek</strong>
            <small>Hong Kong</small>
          </span>
        </Link>
        <span className="status-pill">Private game companion</span>
      </header>

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow">Hong Kong transit edition</p>
          <h1 id="hero-heading">A better game board for the city.</h1>
          <p className="hero-description">
            Coordinate a two-versus-two hide and seek game with a shared Hong
            Kong map, guided questions, timers, and team-only game views.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#getting-started">
              Set up a game
            </a>
            <a className="button button-secondary" href="#features">
              Explore the plan
            </a>
          </div>
        </div>

        <div className="map-preview" aria-label="Illustrated Hong Kong map preview">
          <div className="map-water map-water-one" />
          <div className="map-water map-water-two" />
          <div className="transit-line transit-line-red" />
          <div className="transit-line transit-line-gold" />
          <div className="transit-line transit-line-blue" />
          <span className="map-label label-kowloon">Kowloon</span>
          <span className="map-label label-island">Hong Kong Island</span>
          <span className="station station-one" />
          <span className="station station-two" />
          <span className="station station-three" />
          <span className="map-pin" aria-hidden="true">
            <span />
          </span>
          <p className="map-caption">Hong Kong game board</p>
        </div>
      </section>

      <section className="feature-grid" id="features" aria-label="Planned features">
        <article>
          <span className="feature-number">01</span>
          <h2>Set the rules</h2>
          <p>
            The host will define teams, round timers, the playable area, and
            final-hiding rules before play begins.
          </p>
        </article>
        <article>
          <span className="feature-number">02</span>
          <h2>Follow the board</h2>
          <p>
            Explore districts, islands, MTR, tram, Light Rail, and ferry
            routes through a mobile-friendly game map.
          </p>
        </article>
        <article>
          <span className="feature-number">03</span>
          <h2>Play your role</h2>
          <p>
            Seekers will manage questions and deductions while hiders answer,
            track their time, and log physical-card rewards.
          </p>
        </article>
      </section>

      <section className="getting-started" id="getting-started">
        <div>
          <p className="eyebrow">Now building</p>
          <h2>The game setup is coming first.</h2>
          <p>
            This foundation will grow into the host setup, team dashboards,
            and Hong Kong map. Live location and automated validation remain
            intentionally out of scope for the first version.
          </p>
        </div>
        <span className="phase-label">Phase 0</span>
      </section>
    </main>
  );
}
