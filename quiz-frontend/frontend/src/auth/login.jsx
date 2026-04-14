import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from './authService.js';
import { useAppState } from '../state/quizstate.js';

function Loginpage() {
  const navigate = useNavigate();
  const { loginWithPayload } = useAppState();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = await login(form.email, form.password);
      loginWithPayload(payload);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Host Sign In</p>
          <h1>Return to your quiz command center.</h1>
          <p className="muted-copy">
            Sign in as a registered host to create rooms, upload PDFs, and run live quiz rounds.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="host@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Minimum 10 characters"
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}

export { Loginpage };
