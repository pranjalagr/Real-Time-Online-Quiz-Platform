import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Leaderboard from '../components/leaderboard.jsx';
import { useAppState } from '../state/quizstate.js';

function LeaderboardPage() {
  const { roomId } = useParams();
  const { token } = useAppState();
  const [room, setRoom] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const roomResponse = await api.getRoom(token, roomId);
        const boardResponse = await api.getRoomLeaderboard(token, roomId);
        setRoom(roomResponse.data);
        setRows(boardResponse.data || []);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    load();
  }, [roomId, token]);

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Match Wrap-Up</p>
            <h1>Leaderboard</h1>
            <p className="muted-copy">Final standings for room {room?.room_code}.</p>
          </div>
          <Link className="secondary-button" to="/">
            Back To Home
          </Link>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <Leaderboard rows={rows} title="Final Scores" />
      </section>
    </main>
  );
}

export default LeaderboardPage;
