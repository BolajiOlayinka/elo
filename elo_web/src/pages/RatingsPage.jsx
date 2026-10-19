import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompareIcon, EyeIcon, StarIcon } from '../components/Icons.jsx';
import { Avatar, Flag } from '../components/EntityMarks.jsx';
import { RatingsHero } from '../components/RatingsHero.jsx';
import { getRatings } from '../data/api.js';
import { RATING_TABS } from '../data/rankings.js';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';

export default function RatingsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('players');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [status, setStatus] = useState('loading');
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    let cancel = false;
    let timer = null;

    function load() {
      setStatus('loading');
      getRatings(tab, page)
        .then((body) => {
          if (cancel) {
            return;
          }

          setRows(body?.data || []);
          setPageCount(body?.meta?.pages || 1);
          setBuilding(Boolean(body?.meta?.building));
          setStatus('ready');

          if (body?.meta?.building && !(body?.data || []).length) {
            timer = setTimeout(load, 5000);
          }
        })
        .catch(() => {
          if (!cancel) {
            setStatus('error');
          }
        });
    }

    load();

    return () => {
      cancel = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [tab, page]);

  const visible = rows;

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
              {status === 'loading' ? (
                <tr><td colSpan={7}>Loading ratings…</td></tr>
              ) : null}
              {status === 'error' ? (
                <tr><td colSpan={7}>Ratings are unavailable. Start the API and try again.</td></tr>
              ) : null}
              {status === 'ready' && visible.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    {building
                      ? 'Computing the board from the match record. This page stays paginated — it will fill from cache when the snapshot is ready.'
                      : 'No ratings in this board yet.'}
                  </td>
                </tr>
              ) : null}
              {status === 'ready' ? visible.map((row) => (
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
                      <Flag code={row.flag || '—'} />
                      {row.place || '—'}
                    </div>
                  </td>
                  <td>{row.career}</td>
                  <td>{row.peak}</td>
                  <td>{row.era || '—'}</td>
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
              )) : null}
            </tbody>
          </table>

          <div className="pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {t('common.previous')}
            </button>
            <span>{page} / {pageCount}</span>
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
