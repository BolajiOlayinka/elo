import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { USERS } from '../data/demo.js';
import { IconSearch } from '../components/Icons.jsx';

const LANG = { en: 'EN', fr: 'FR', es: 'ES', pt: 'PT', de: 'DE' };

export default function Users() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return USERS;
    }

    return USERS.filter((user) => (
      `${user.firstName} ${user.lastName} ${user.email} ${user.country} ${user.language}`.toLowerCase().includes(needle)
    ));
  }, [query]);

  const online = USERS.filter((user) => user.online).length;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Public accounts, language, follows, and last seen. {online} online now.</p>
        </div>
        <label className="search">
          <IconSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, country, language"
          />
        </label>
      </div>

      <article className="panel">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Language</th>
                <th>Status</th>
                <th>Follows</th>
                <th>Last seen</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="name-cell">
                      <span className="avatar sm">
                        {user.online ? <i className="live-dot on-avatar" /> : null}
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                      <div>
                        <strong>{user.firstName} {user.lastName}</strong>
                        <p className="muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{LANG[user.language] || 'EN'}</td>
                  <td>
                    <span className={user.isVerified ? 'tag ok' : 'tag'}>
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>{(user.follows || []).length}</td>
                  <td>{user.lastSeen || user.lastLogin}</td>
                  <td>{user.createdAt}</td>
                  <td>
                    <Link className="btn ghost" to={`/users/${user.id}`}>View profile</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="empty">No users match that search.</p> : null}
      </article>
    </section>
  );
}
