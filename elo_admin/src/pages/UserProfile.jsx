import { Link, useParams } from 'react-router-dom';
import { getUser } from '../data/demo.js';

export default function UserProfile() {
  const { id } = useParams();
  const user = getUser(id);

  if (!user) {
    return (
      <section>
        <h1>User not found</h1>
        <p className="muted">This demo account does not exist.</p>
        <Link className="btn ghost" to="/users">Back to users</Link>
      </section>
    );
  }

  return (
    <section>
      <p className="back"><Link to="/users">Users</Link> / Profile</p>
      <div className="page-head">
        <div className="name-cell lg">
          <span className="avatar">{user.firstName[0]}{user.lastName[0]}</span>
          <div>
            <h1>{user.firstName} {user.lastName}</h1>
            <p>{user.email}</p>
          </div>
        </div>
        <span className={user.isVerified ? 'tag ok' : 'tag'}>
          {user.isVerified ? 'Verified' : 'Unverified'}
        </span>
      </div>

      <div className="split">
        <article className="panel">
          <h2>Profile</h2>
          <dl className="facts">
            <div><dt>Phone</dt><dd>{user.phone}</dd></div>
            <div><dt>City</dt><dd>{user.city}</dd></div>
            <div><dt>Country</dt><dd>{user.country}</dd></div>
            <div><dt>Roles</dt><dd>{user.roles.join(', ')}</dd></div>
            <div><dt>Joined</dt><dd>{user.createdAt}</dd></div>
            <div><dt>Last login</dt><dd>{user.lastLogin}</dd></div>
            <div><dt>Page visits</dt><dd>{user.visits}</dd></div>
          </dl>
        </article>
        <article className="panel">
          <h2>Activity</h2>
          <ul className="timeline">
            <li><strong>Last session</strong><span>{user.lastLogin}</span></li>
            <li><strong>Compared two players</strong><span>Demo · ratings</span></li>
            <li><strong>Opened a profile</strong><span>Demo · players</span></li>
            <li><strong>Account created</strong><span>{user.createdAt}</span></li>
          </ul>
        </article>
      </div>
    </section>
  );
}
