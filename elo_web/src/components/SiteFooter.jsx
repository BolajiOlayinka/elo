import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <Link className="logo" to="/">EloStats Football</Link>
          <p>{t('footer.tagline')}</p>
        </div>
        <div>
          <h3>{t('footer.product')}</h3>
          <Link to="/ratings">{t('footer.features')}</Link>
          <a href="/#method">{t('footer.methodology')}</a>
          <a href="/#method">{t('footer.eraEngine')}</a>
          <Link to="/ratings">{t('footer.pricing')}</Link>
        </div>
        <div>
          <h3>{t('footer.methodology')}</h3>
          <Link to="/analysis">{t('footer.analysis')}</Link>
          <a href="/#method">{t('footer.governance')}</a>
          <a href="/#method">{t('footer.coverage')}</a>
          <a href="/#faq">{t('footer.faq')}</a>
        </div>
        <div>
          <h3>{t('footer.company')}</h3>
          <Link to="/">{t('footer.about')}</Link>
          <Link to="/">{t('footer.team')}</Link>
          <Link to="/">{t('footer.contact')}</Link>
          <Link to="/">{t('footer.careers')}</Link>
        </div>
        <div>
          <h3>{t('footer.legal')}</h3>
          <Link to="/">{t('footer.privacy')}</Link>
          <Link to="/">{t('footer.terms')}</Link>
          <Link to="/">{t('footer.disclaimers')}</Link>
          <Link to="/">{t('footer.security')}</Link>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>{t('footer.copy')}</span>
        <span>{t('footer.demo')}</span>
      </div>
    </footer>
  );
}
