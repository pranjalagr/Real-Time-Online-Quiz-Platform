import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from './authService.js';

function Registerpage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(form.email, form.password);
      setSuccess('Registration complete. You can sign in now.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
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
          <p className="eyebrow">Create Host Account</p>
          <h1>Launch quiz rooms with a secure host profile.</h1>
          <p className="muted-copy">
            Registered hosts can build quizzes manually or from PDF documents and manage live sessions.
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
          {success ? <p className="form-success">{success}</p> : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export { Registerpage };
