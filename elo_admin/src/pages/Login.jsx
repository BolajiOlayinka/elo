import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('bolaji@elostats.football');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname || '/';

  if (session) {
    return <Navigate to={from} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    const result = await login(email, password);

    if (!result.ok) {
      setError(result.message);

      return;
    }

    navigate(from, { replace: true });
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            <strong>EloStats</strong>
            <p>Admin</p>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="muted">Staff only. Sign-in asks the API for a token, then keeps the session in your browser.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError('');
            }}
          />
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <button type="submit" className="btn lime">Sign in</button>
        <p className="muted login-hint">
          Demo: <code>bolaji@elostats.football</code> / <code>elostats</code>
        </p>
      </form>
    </div>
  );
}
