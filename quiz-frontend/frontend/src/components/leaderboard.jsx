function Leaderboard({ rows = [], title = 'Leaderboard' }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>{title}</h3>
        <span className="status-pill">Live</span>
      </div>

      <div className="leaderboard-list">
        {rows.length ? (
          rows.map((row, index) => (
            <article className="leaderboard-row" key={`${row.user_id || row.team_id}-${index}`}>
              <div className="leaderboard-rank">{row.rank || index + 1}</div>
              <div className="leaderboard-identity">
                <strong>{row.username || row.team_name || 'Player'}</strong>
                <span>{row.user_id ? `User #${row.user_id}` : `Team #${row.team_id}`}</span>
              </div>
              <div className="leaderboard-score">{row.score}</div>
            </article>
          ))
        ) : (
          <p className="empty-state">Scores will appear here once answers start coming in.</p>
        )}
      </div>
    </section>
  );
}

export default Leaderboard;
