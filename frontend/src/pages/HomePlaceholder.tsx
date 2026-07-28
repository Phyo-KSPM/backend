import { Link } from 'react-router-dom';
import { clearSession, getSession } from '../lib/auth';
import './HomePlaceholder.css';

/** Temporary landing after login — full admin UI comes next. */
export function HomePlaceholder() {
  const session = getSession();

  return (
    <main className="home">
      <div className="home__panel">
        <p className="home__eyebrow">CEIR Admin</p>
        <h1 className="home__title">You are signed in</h1>
        <p className="home__text">
          {session?.user.fullName || session?.user.email || 'Admin'} — account
          management UI will be built here next.
        </p>
        <div className="home__actions">
          <Link
            className="home__btn"
            to="/login"
            onClick={() => clearSession()}
          >
            Sign out
          </Link>
        </div>
      </div>
    </main>
  );
}
