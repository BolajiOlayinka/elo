import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <Link className="logo" to="/">EloStats Football</Link>
          <p>A persistent football intelligence platform. A shared language for careers, peaks, and eras.</p>
        </div>
        <div>
          <h3>Product</h3>
          <Link to="/ratings">Features</Link>
          <a href="/#method">Methodology</a>
          <a href="/#method">Era Engine</a>
          <Link to="/ratings">Pricing</Link>
        </div>
        <div>
          <h3>Methodology</h3>
          <a href="/#analyst">AI Analyst</a>
          <a href="/#method">Model Governance</a>
          <a href="/#method">Data Coverage</a>
          <a href="/#faq">FAQ</a>
        </div>
        <div>
          <h3>Company</h3>
          <Link to="/">About</Link>
          <Link to="/">Team</Link>
          <Link to="/">Contact</Link>
          <Link to="/">Careers</Link>
        </div>
        <div>
          <h3>Legal</h3>
          <Link to="/">Privacy</Link>
          <Link to="/">Terms</Link>
          <Link to="/">Data &amp; Disclaimers</Link>
          <Link to="/">Security</Link>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© 2026 EloStats Football</span>
        <span>Illustrative demo data throughout · Independent design, no club or league affiliation</span>
      </div>
    </footer>
  );
}
