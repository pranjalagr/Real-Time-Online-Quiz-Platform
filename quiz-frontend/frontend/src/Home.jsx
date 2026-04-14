import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './api/client.js';
import { createGuest } from './auth/authService.js';
import { useAppState } from './state/quizstate.js';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithPayload, logout, socketStatus, user, token } = useAppState();
  const [roomMode, setRoomMode] = useState('SOLO');
  const [roomCode, setRoomCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState('');

  const handleCreateRoom = async () => {
    setActionError('');
    setLoading('create');
    try {
      const response = await api.createRoom(token, { roomMode });
      navigate(`/rooms/${response.data.roomId}/lobby`);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setLoading('');
    }
  };

  const handleGuestJoin = async () => {
    setActionError('');
    setLoading('join');

    try {
      let activeToken = token;

      if (!activeToken) {
        if (!guestName.trim()) {
          throw new Error('Enter a display name before joining');
        }

        const payload = await createGuest(guestName.trim());
        loginWithPayload(payload);
        activeToken = payload.data.token;
      }

      const response = await api.joinRoom(activeToken, { roomCode: roomCode.trim() });
      navigate(`/rooms/${response.data.roomId}/lobby`);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setLoading('');
    }
  };

  return (
    <main className="landing-shell">
      <div className="hero-noise" />

      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-icon">△</span>
          <strong>QUIZ APEX</strong>
        </div>

        <div className="topbar-actions">
          {isAuthenticated ? (
            <>
              <span className="status-chip">Socket {socketStatus}</span>
              <span className="status-chip">Signed in as {user?.username || user?.email || 'host'}</span>
              <button className="ghost-button" type="button" onClick={logout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-button" to="/login">
                Host Sign In
              </Link>
              <Link className="topbar-cta" to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <p className="eyebrow hero-badge">LIVE ROOMS. REAL-TIME PLAY.</p>
        <h1>
          Compete. Climb.
          <span> Prove your skill.</span>
        </h1>
        <p className="hero-copy">
          Build quiz rooms, upload PDFs, launch live rounds, and keep the leaderboard moving in real time.
        </p>

        <div className="hero-cta-row">
          {isAuthenticated ? (
            <button className="primary-button hero-button" type="button" onClick={handleCreateRoom} disabled={loading === 'create'}>
              {loading === 'create' ? 'Creating Room...' : 'Create Room'}
            </button>
          ) : (
            <Link className="primary-button hero-button" to="/register">
              Become a Host
            </Link>
          )}

          <button className="secondary-button hero-button" type="button" onClick={() => document.getElementById('join-panel')?.scrollIntoView({ behavior: 'smooth' })}>
            Join With Room Code
          </button>
        </div>
      </section>

      <section className="action-grid" id="join-panel">
        <article className="panel-card">
          <div className="panel-header">
            <h3>Host Setup</h3>
            <span className="status-pill">Backend Ready</span>
          </div>

          <p className="muted-copy">
            Hosts can create solo rooms, build quizzes by hand, or generate them from uploaded PDFs.
          </p>

          <div className="segmented-control">
            <button
              type="button"
              className={roomMode === 'SOLO' ? 'segmented active' : 'segmented'}
              onClick={() => setRoomMode('SOLO')}
            >
              Solo Room
            </button>
            <button type="button" className="segmented disabled" disabled>
              Team Mode Soon
            </button>
          </div>

          {isAuthenticated ? (
            <button className="primary-button" type="button" onClick={handleCreateRoom} disabled={loading === 'create'}>
              {loading === 'create' ? 'Creating Room...' : 'Create Host Room'}
            </button>
          ) : (
            <p className="empty-state">Sign in as a host first to create rooms and manage quiz flows.</p>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-header">
            <h3>Join A Room</h3>
            <span className="status-pill">Guest Friendly</span>
          </div>

          <p className="muted-copy">
            Players can join with just a name. If you are already signed in, we will reuse your current session.
          </p>

          {!isAuthenticated ? (
            <label>
              <span>Display Name</span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Enter your player name"
              />
            </label>
          ) : null}

          <label>
            <span>Room Code</span>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Paste 8-character room code"
            />
          </label>

          {actionError ? <p className="form-error">{actionError}</p> : null}

          <button className="primary-button" type="button" onClick={handleGuestJoin} disabled={loading === 'join'}>
            {loading === 'join' ? 'Joining...' : 'Join Room'}
          </button>
        </article>
      </section>
    </main>
  );
}

export default Home;
