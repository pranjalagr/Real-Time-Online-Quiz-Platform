import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Leaderboard from '../components/leaderboard.jsx';
import Timer from '../components/timer.jsx';
import { useAppState } from '../state/quizstate.js';
import { emitSocket, getSocket } from '../socket/socketclient.js';

function QuizHostPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, socketStatus } = useAppState();
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

  useEffect(() => {
    if (room?.state !== 'LIVE' || !room?.currentQuiz) {
      setSecondsRemaining(0);
      return undefined;
    }

    setSecondsRemaining(Number(room.currentQuiz.duration_seconds || 0));

    const timer = setInterval(() => {
      setSecondsRemaining((current) => {
        const next = current <= 1 ? 0 : current - 1;
        if (next === 0) {
          clearInterval(timer);
          setTimeout(() => navigate(`/rooms/${roomId}/leaderboard`), 0);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, room?.currentQuiz?.id, room?.currentQuiz?.duration_seconds, room?.state, roomId]);

  useEffect(() => {
    const syncRoom = async () => {
      try {
        await emitSocket('SYNC_ROOM', { roomId: Number(roomId) });
      } catch {
        // We retry indirectly on the next room refresh if the socket is not ready yet.
      }
    };

    syncRoom();
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || socketStatus !== 'online') {
      return undefined;
    }

    const handleQuizEnded = (payload) => {
      if (Number(payload?.roomId) !== Number(roomId)) {
        return;
      }

      navigate(`/rooms/${roomId}/leaderboard`);
    };

    socket.on('QUIZ_ENDED', handleQuizEnded);

    return () => {
      socket.off('QUIZ_ENDED', handleQuizEnded);
    };
  }, [navigate, roomId, socketStatus]);

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Host Console</p>
            <h1>Live Room {room?.room_code}</h1>
            <p className="muted-copy">Monitor the room while the round runs and wait for the timer worker to close it out.</p>
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

          </section>

          <Leaderboard rows={leaderboard} title="Live Leaderboard" />
        </div>
      </section>
    </main>
  );
}

export default QuizHostPage;
