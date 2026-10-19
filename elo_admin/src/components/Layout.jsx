import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  IconBadge,
  IconChevron,
  IconCog,
  IconEssay,
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
  { to: '/directory', label: 'Ratings', icon: IconGrid },
  {
    to: '/analysis',
    label: 'Analysis',
    icon: IconEssay,
    children: [
      { to: '/analysis', label: 'Posts', end: true },
      { to: '/analysis/comments', label: 'Comments' },
      { to: '/analysis/categories', label: 'Categories' },
      { to: '/analysis/tags', label: 'Tags' }
    ]
  },
  { to: '/staffs', label: 'Staff', icon: IconBadge },
  { to: '/roles', label: 'User roles', icon: IconShield },
  { to: '/settings', label: 'Settings', icon: IconCog }
];

function NavItem({ link, onNavigate }) {
  const location = useLocation();
  const onSection = Boolean(link.children && (location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)));
  const [toggled, setToggled] = useState(false);
  const open = onSection || toggled;

  if (!link.children) {
    return (
      <NavLink to={link.to} end={link.end} onClick={onNavigate}>
        <link.icon />
        {link.label}
      </NavLink>
    );
  }

  return (
    <div className="nav-group">
      <button
        type="button"
        className={`nav-group-toggle${onSection ? ' is-current' : ''}${open ? ' is-open' : ''}`}
        aria-expanded={open}
        onClick={() => setToggled((value) => !value)}
      >
        <link.icon />
        {link.label}
        <IconChevron />
      </button>
      {open ? (
        <div className="nav-sub">
          {link.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              onClick={onNavigate}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();

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
            <NavItem key={link.to} link={link} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{session.firstName[0]}{session.lastName[0]}</span>
          <div>
            <strong>{session.firstName} {session.lastName}</strong>
            <p>{session.role}</p>
            <button type="button" className="text-btn" onClick={logout}>Sign out</button>
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
