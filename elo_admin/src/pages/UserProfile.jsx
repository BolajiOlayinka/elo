import { Link, useParams } from 'react-router-dom';
import { getUser } from '../data/demo.js';

const LANG = { en: 'English', fr: 'French', es: 'Spanish', pt: 'Portuguese', de: 'German' };

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

  const name = `${user.firstName} ${user.lastName}`;

  return (
    <section>
      <p className="back"><Link to="/users">Users</Link> / {name}</p>

      <article className="member-hero">
        <span className="avatar xl">{user.firstName[0]}{user.lastName[0]}</span>
        <div className="member-hero-copy">
          <div className="member-hero-title">
            <h1>{name}</h1>
            {user.online ? <em className="live-chip"><i className="live-dot" />Online</em> : null}
            <span className={user.isVerified ? 'tag ok' : 'tag'}>
              {user.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <p>{user.email}</p>
          <p className="muted">
            {user.city}, {user.country}
            {user.bio ? ` · ${user.bio}` : ''}
          </p>
        </div>
        <dl className="member-hero-meta">
          <div>
            <dt>Language</dt>
            <dd>{LANG[user.language] || user.language || 'English'}</dd>
          </div>
          <div>
            <dt>Last seen</dt>
            <dd>{user.lastSeen || user.lastLogin}</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{user.createdAt}</dd>
          </div>
        </dl>
      </article>

      <div className="hero-stats member-kpis">
        <article className="stat-card">
          <p>Page visits</p>
          <strong>{user.visits}</strong>
          <span>Attached to this account</span>
        </article>
        <article className="stat-card">
          <p>Follows</p>
          <strong>{(user.follows || []).length}</strong>
          <span>Players they watch</span>
        </article>
        <article className="stat-card">
          <p>Comparisons</p>
          <strong>{(user.comparisons || []).length}</strong>
          <span>Saved or run from Compare</span>
        </article>
        <article className="stat-card">
          <p>Debate</p>
          <strong>{user.reputation || 0}</strong>
          <span>{user.debates || 0} arguments and replies</span>
        </article>
      </div>

      <div className="split">
        <article className="panel">
          <h2>Identity</h2>
          <dl className="facts">
            <div><dt>Phone</dt><dd>{user.phone}</dd></div>
            <div><dt>Date of birth</dt><dd>{user.dob || '—'}</dd></div>
            <div><dt>City</dt><dd>{user.city}</dd></div>
            <div><dt>Country</dt><dd>{user.country}</dd></div>
            <div><dt>Roles</dt><dd>{user.roles.join(', ')}</dd></div>
            <div><dt>Language</dt><dd>{LANG[user.language] || 'English'}</dd></div>
          </dl>
        </article>
        <article className="panel">
          <h2>Session</h2>
          <p className="muted">Signals the public site should send on each visit. Missing from admin until this desk.</p>
          <dl className="facts">
            <div><dt>Device</dt><dd>{user.device || '—'}</dd></div>
            <div><dt>Landing page</dt><dd>{user.landing || '—'}</dd></div>
            <div><dt>Referrer</dt><dd>{user.referrer || '—'}</dd></div>
            <div><dt>Last login</dt><dd>{user.lastLogin}</dd></div>
            <div><dt>Last seen</dt><dd>{user.lastSeen || '—'}</dd></div>
          </dl>
        </article>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <article className="panel">
          <div className="panel-head">
            <h2>Following</h2>
            <span>From player profiles</span>
          </div>
          {(user.follows || []).length ? (
            <ul className="chip-list">
              {user.follows.map((player) => (
                <li key={player}>{player}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No follows yet.</p>
          )}

          <div className="panel-head" style={{ marginTop: 22 }}>
            <h2>Comparisons</h2>
            <span>Saved pairings</span>
          </div>
          {(user.comparisons || []).length ? (
            <ul className="timeline">
              {user.comparisons.map((row) => (
                <li key={`${row.left}-${row.right}`}>
                  <strong>{row.left} vs {row.right}</strong>
                  <span>{row.when}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No comparisons saved.</p>
          )}
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2>Activity</h2>
            <span>Account + product</span>
          </div>
          <ul className="timeline">
            <li><strong>Last session</strong><span>{user.lastLogin}</span></li>
            {user.comparisons?.[0] ? (
              <li>
                <strong>Compared {user.comparisons[0].left} and {user.comparisons[0].right}</strong>
                <span>{user.comparisons[0].when}</span>
              </li>
            ) : null}
            {user.follows?.[0] ? (
              <li><strong>Followed {user.follows[0]}</strong><span>From a profile</span></li>
            ) : null}
            {user.debates ? (
              <li><strong>Posted in Analysis debate</strong><span>{user.debates} items · {user.reputation} pts</span></li>
            ) : null}
            <li><strong>Account created</strong><span>{user.createdAt}</span></li>
          </ul>
        </article>
      </div>
    </section>
  );
}
