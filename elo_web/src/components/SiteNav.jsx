import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, StarIcon } from './Icons.jsx';

function NavItem({ to, active, children }) {
  return (
    <Link className={active ? 'is-active' : ''} to={to}>
      {active ? <StarIcon /> : null}
      {children}
    </Link>
  );
}

export function SiteNav() {
  const location = useLocation();
  const onRatings = ['/ratings', '/profile', '/compare'].some((path) => (
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  ));
  const onAnalyst = location.hash === '#analyst';
  const onMethod = location.hash === '#method' || location.hash === '#faq';

  return (
    <header className="nav">
      <Link className="logo" to="/">EloStats Football</Link>
      <nav className="nav-links">
        <NavItem to="/ratings" active={onRatings && !onAnalyst && !onMethod}>Ratings</NavItem>
        <NavItem to="/#analyst" active={onAnalyst}>AI Analyst</NavItem>
        <NavItem to="/#method" active={onMethod}>Methodology</NavItem>
      </nav>
      <Link className="btn btn-lime btn-explore nav-cta" to="/ratings">
        Explore Ratings
        <ArrowUpRight size={10} />
      </Link>
    </header>
  );
}
