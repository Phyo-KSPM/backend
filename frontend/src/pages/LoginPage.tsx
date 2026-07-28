import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getSession, loginAdmin } from '../lib/auth';
import './LoginPage.css';

type LoginMode = 'email' | 'agent';

export function LoginPage() {
  const navigate = useNavigate();
  const existing = getSession();
  const [mode, setMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (existing?.accessToken) {
    return <Navigate to="/home" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'email' && !email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (mode === 'agent' && !accountId.trim()) {
      setError('Enter your Agent Account ID.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'email') {
        await loginAdmin({ mode: 'email', email: email.trim(), password });
      } else {
        await loginAdmin({
          mode: 'agent',
          agentId: accountId.trim(),
          password,
        });
      }
      navigate('/home', { replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Login failed';
      if (/deviceId/i.test(raw) || /deviceFingerprint/i.test(raw) || /email, password/i.test(raw)) {
        setError('Sign-in failed. Check your credentials and try again.');
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <section className="login__brand">
        <div className="login__brand-inner">
          <p className="login__kicker">Myanmar · National registry</p>
          <h1 className="login__title">CEIR</h1>
          <p className="login__subtitle">
            Central Equipment Identity Register
          </p>
          <p className="login__blurb">
            Admin access for agent accounts, device bindings, and operational
            control.
          </p>
        </div>
        <p className="login__brand-foot">Operations console</p>
      </section>

      <section className="login__panel">
        <div className="login__panel-inner">
          <h2 className="login__heading">Sign in</h2>
          <p className="login__lede">Use email or Agent Account ID.</p>

          <form className="login__form" onSubmit={onSubmit} noValidate>
            <div className="login__modes" role="tablist" aria-label="Sign-in method">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'email'}
                className={mode === 'email' ? 'is-on' : undefined}
                onClick={() => setMode('email')}
              >
                Email
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'agent'}
                className={mode === 'agent' ? 'is-on' : undefined}
                onClick={() => setMode('agent')}
              >
                Agent ID
              </button>
            </div>

            {mode === 'email' ? (
              <label className="login__field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            ) : (
              <label className="login__field">
                <span>Agent Account ID</span>
                <input
                  type="text"
                  name="accountId"
                  autoComplete="username"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="login__field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error ? (
              <p className="login__error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="login__submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
