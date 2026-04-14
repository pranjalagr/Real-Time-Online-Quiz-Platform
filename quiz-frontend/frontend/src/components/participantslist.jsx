function ParticipantsList({ users = [] }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>Players In Lobby</h3>
        <span className="status-pill">{users.length} joined</span>
      </div>

      <div className="participant-grid">
        {users.length ? (
          users.map((user) => (
            <article className="participant-card" key={`${user.user_id}-${user.joined_at}`}>
              <strong>{user.username}</strong>
              <span>{user.role}</span>
            </article>
          ))
        ) : (
          <p className="empty-state">Nobody has joined yet. Share the room code to start filling the lobby.</p>
        )}
      </div>
    </section>
  );
}

export default ParticipantsList;
