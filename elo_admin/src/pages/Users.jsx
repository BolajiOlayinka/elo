import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { USERS } from '../data/demo.js';
import { IconSearch } from '../components/Icons.jsx';

export default function Users() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return USERS;
    }

    return USERS.filter((user) => (
      `${user.firstName} ${user.lastName} ${user.email} ${user.country}`.toLowerCase().includes(needle)
    ));
  }, [query]);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Everyone who has signed up on the public site.</p>
        </div>
        <label className="search">
          <IconSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, country"
          />
        </label>
      </div>

      <article className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Country</th>
              <th>Status</th>
              <th>Last login</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="name-cell">
                    <span className="avatar sm">{user.firstName[0]}{user.lastName[0]}</span>
                    <div>
                      <strong>{user.firstName} {user.lastName}</strong>
                      <p className="muted">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>{user.country}</td>
                <td>
                  <span className={user.isVerified ? 'tag ok' : 'tag'}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td>{user.lastLogin}</td>
                <td>{user.createdAt}</td>
                <td>
                  <Link className="btn ghost" to={`/users/${user.id}`}>View profile</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="empty">No users match that search.</p> : null}
      </article>
    </section>
  );
}
