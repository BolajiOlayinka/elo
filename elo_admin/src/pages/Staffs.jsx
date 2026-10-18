import { useState } from 'react';
import { ROLES, STAFF } from '../data/demo.js';

export default function Staffs() {
  const [staff, setStaff] = useState(STAFF);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'Viewer' });
  const [notice, setNotice] = useState('');

  function invite(event) {
    event.preventDefault();

    if (!form.firstName || !form.email) {
      setNotice('First name and email are required.');

      return;
    }

    setStaff((current) => [
      {
        id: `s${current.length + 1}`,
        ...form,
        department: 'Unassigned',
        status: 'Invited',
        lastLogin: 'Never'
      },
      ...current
    ]);
    setForm({ firstName: '', lastName: '', email: '', role: 'Viewer' });
    setNotice(`Invite queued for ${form.email} (demo).`);
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Staff</h1>
          <p>People who can sign in to this admin.</p>
        </div>
      </div>

      <div className="split">
        <article className="panel grow">
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id}>
                  <td>
                    <div className="name-cell">
                      <span className="avatar sm">{person.firstName[0]}{person.lastName[0] || '?'}</span>
                      <div>
                        <strong>{person.firstName} {person.lastName}</strong>
                        <p className="muted">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{person.role}</td>
                  <td>{person.department}</td>
                  <td>
                    <span className={person.status === 'Active' ? 'tag ok' : 'tag'}>{person.status}</span>
                  </td>
                  <td>{person.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <form className="panel" onSubmit={invite}>
          <h2>Invite staff</h2>
          <label>
            First name
            <input
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </label>
          <label>
            Last name
            <input
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {ROLES.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn lime">Send invite</button>
          {notice ? <p className="notice">{notice}</p> : null}
        </form>
      </div>
    </section>
  );
}
