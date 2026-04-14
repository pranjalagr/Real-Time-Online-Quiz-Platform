import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Leaderboard from '../components/leaderboard.jsx';
import Timer from '../components/timer.jsx';
import { useAppState } from '../state/quizstate.js';

function QuizHostPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token } = useAppState();
  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const roomResponse = await api.getRoom(token, roomId);
      const boardResponse = await api.getRoomLeaderboard(token, roomId);
      setRoom(roomResponse.data);
      setLeaderboard(boardResponse.data || []);
      setSecondsRemaining(Number(roomResponse.data.currentQuiz?.duration_seconds || 0));

      if (roomResponse.data.state === 'ENDED') {
        navigate(`/rooms/${roomId}/leaderboard`);
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [roomId, token]);

  const endQuiz = async () => {
    try {
      await api.endRoomQuiz(token, roomId);
      navigate(`/rooms/${roomId}/leaderboard`);
    } catch (endError) {
      setError(endError.message);
    }
  };

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Host Console</p>
            <h1>Live Room {room?.room_code}</h1>
            <p className="muted-copy">Monitor the room and end the quiz when the round is complete.</p>
          </div>
          <Timer seconds={secondsRemaining} />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="room-grid">
          <section className="panel-card">
            <div className="panel-header">
              <h3>Round Snapshot</h3>
              <span className="status-pill">{room?.state || 'LIVE'}</span>
            </div>

            <dl className="detail-grid">
              <div>
                <dt>Room Code</dt>
                <dd>{room?.room_code}</dd>
              </div>
              <div>
                <dt>Quiz Id</dt>
                <dd>{room?.currentQuiz?.id}</dd>
              </div>
              <div>
                <dt>Participants</dt>
                <dd>{room?.users?.length || 0}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{room?.room_mode}</dd>
              </div>
            </dl>

            <button className="primary-button" type="button" onClick={endQuiz}>
              End Quiz
            </button>
          </section>

          <Leaderboard rows={leaderboard} title="Live Leaderboard" />
        </div>
      </section>
    </main>
  );
}

export default QuizHostPage;
