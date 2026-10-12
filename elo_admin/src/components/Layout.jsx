import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { SESSION } from '../data/demo.js';
import {
  IconBadge,
  IconCog,
  IconGrid,
  IconMenu,
  IconPoints,
  IconShield,
  IconUsers
} from './Icons.jsx';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/points', label: 'Point settings', icon: IconPoints },
  { to: '/staffs', label: 'Staffs', icon: IconBadge },
  { to: '/roles', label: 'User roles', icon: IconShield },
  { to: '/settings', label: 'Settings', icon: IconCog }
];

export function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className={open ? 'shell is-open' : 'shell'}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            <strong>EloStats</strong>
            <p>Admin</p>
          </div>
        </div>
        <nav>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
            >
              <link.icon />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{SESSION.firstName[0]}{SESSION.lastName[0]}</span>
          <div>
            <strong>{SESSION.firstName} {SESSION.lastName}</strong>
            <p>{SESSION.role}</p>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="menu-btn" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            <IconMenu />
          </button>
          <p className="crumb">Demo data · not connected to the API yet</p>
          <span className="pill">Preview</span>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
