import { useState } from 'react';
import { PERMISSIONS, ROLES } from '../data/demo.js';

export default function Roles() {
  const [roles, setRoles] = useState(ROLES);
  const [notice, setNotice] = useState('');

  function toggle(roleId, permission) {
    setRoles((current) => current.map((role) => {
      if (role.id !== roleId) {
        return role;
      }

      const has = role.permissions.includes(permission);

      return {
        ...role,
        permissions: has
          ? role.permissions.filter((item) => item !== permission)
          : [...role.permissions, permission]
      };
    }));
    setNotice('');
  }

  function save() {
    setNotice('Role permissions saved locally (demo).');
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>User roles</h1>
          <p>What each staff role can do inside the admin.</p>
        </div>
        <button type="button" className="btn lime" onClick={save}>Save roles</button>
      </div>

      {notice ? <p className="notice">{notice}</p> : null}

      <div className="role-grid">
        {roles.map((role) => (
          <article key={role.id} className="panel">
            <h2>{role.name}</h2>
            <p className="muted">{role.description}</p>
            <ul className="checks">
              {PERMISSIONS.map((permission) => (
                <li key={permission}>
                  <label>
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(permission)}
                      onChange={() => toggle(role.id, permission)}
                      disabled={role.id === 'super-admin'}
                    />
                    {permission}
                  </label>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
