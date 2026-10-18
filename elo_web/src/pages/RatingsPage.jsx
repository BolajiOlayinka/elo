import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CompareIcon, EyeIcon, StarIcon } from '../components/Icons.jsx';
import { Avatar, Flag } from '../components/EntityMarks.jsx';
import { RatingsHero } from '../components/RatingsHero.jsx';
import { getRankings, PAGE_SIZE, RATING_TABS } from '../data/rankings.js';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

export default function RatingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('players');
  const [page, setPage] = useState(1);
  const rows = getRankings(tab);
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page ratings-page">
      <RatingsHero />

      <div className="page-divider" />

      <section className="ratings-board">
        <div className="wrap">
          <div className="ratings-tabs story-lenses" role="tablist" aria-label={t('ratings.entity')}>
            {RATING_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'is-active' : ''}
                onClick={() => {
                  setTab(item.id);
                  setPage(1);
                }}
              >
                {tab === item.id ? <StarIcon /> : null}
                {t(`ratings.tab.${item.id}`, item.label)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="page-divider" />

      <section className="ratings-table-wrap">
        <div className="wrap">
          <table className="ratings-table">
            <thead>
              <tr>
                <th>{t('ratings.rank')}</th>
                <th>{t('ratings.name')}</th>
                <th>{t('ratings.country')}</th>
                <th>{t('ratings.careerPoints')}</th>
                <th>{t('ratings.peak')}</th>
                <th>{t('ratings.era')}</th>
                <th>{t('ratings.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>{String(row.rank).padStart(2, '0')}</td>
                  <td>
                    <div className="entity-cell">
                      <Avatar initials={row.initials} size={28} />
                      {row.name}
                    </div>
                  </td>
                  <td>
                    <div className="entity-cell">
                      <Flag code={row.flag} />
                      {row.place}
                    </div>
                  </td>
                  <td>{row.career}</td>
                  <td>{row.peak}</td>
                  <td>{row.era}</td>
                  <td>
                    <div className="ratings-actions">
                      <Link className="table-btn" to={`/profile/${row.type}/${row.id}`}>
                        <EyeIcon />
                        {t('ratings.view')}
                      </Link>
                      <Link className="table-btn" to={`/compare?type=${row.type}&id=${row.id}`}>
                        <CompareIcon />
                        {t('ratings.compare')}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {t('common.previous')}
            </button>
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index + 1}
                type="button"
                className={page === index + 1 ? 'is-active' : ''}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>
              {t('common.next')}
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
