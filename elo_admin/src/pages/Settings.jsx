import { useState } from 'react';
import { SESSION } from '../data/demo.js';

export default function Settings() {
  const [profile, setProfile] = useState(SESSION);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [profileNotice, setProfileNotice] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  function saveProfile(event) {
    event.preventDefault();
    setProfileNotice('Profile updated in this session (demo).');
  }

  function savePassword(event) {
    event.preventDefault();

    if (password.next.length < 8) {
      setPasswordNotice('New password must be at least 8 characters.');

      return;
    }

    if (password.next !== password.confirm) {
      setPasswordNotice('New password and confirmation do not match.');

      return;
    }

    setPassword({ current: '', next: '', confirm: '' });
    setPasswordNotice('Password reset saved locally (demo).');
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Update your staff profile and reset your password.</p>
        </div>
      </div>

      <div className="split">
        <form className="panel" onSubmit={saveProfile}>
          <h2>Profile</h2>
          <label>
            First name
            <input
              value={profile.firstName}
              onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
            />
          </label>
          <label>
            Last name
            <input
              value={profile.lastName}
              onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </label>
          <label>
            City
            <input
              value={profile.city}
              onChange={(event) => setProfile({ ...profile, city: event.target.value })}
            />
          </label>
          <button type="submit" className="btn lime">Save profile</button>
          {profileNotice ? <p className="notice">{profileNotice}</p> : null}
        </form>

        <form className="panel" onSubmit={savePassword}>
          <h2>Reset password</h2>
          <label>
            Current password
            <input
              type="password"
              value={password.current}
              onChange={(event) => setPassword({ ...password, current: event.target.value })}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={password.next}
              onChange={(event) => setPassword({ ...password, next: event.target.value })}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={password.confirm}
              onChange={(event) => setPassword({ ...password, confirm: event.target.value })}
            />
          </label>
          <button type="submit" className="btn lime">Update password</button>
          {passwordNotice ? <p className="notice">{passwordNotice}</p> : null}
        </form>
      </div>
    </section>
  );
}
