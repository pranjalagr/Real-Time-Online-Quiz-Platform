import { Link } from 'react-router-dom';

function ResultsPage() {
  return (
    <main className="page-shell">
      <section className="page-card compact-panel">
        <p className="eyebrow">Results</p>
        <h1>Results are shown through the leaderboard route.</h1>
        <p className="muted-copy">
          This placeholder page is kept so the existing file structure stays intact while the main result experience lives in the room leaderboard screen.
        </p>
        <Link className="primary-button" to="/">
          Return Home
        </Link>
      </section>
    </main>
  );
}

export default ResultsPage;
