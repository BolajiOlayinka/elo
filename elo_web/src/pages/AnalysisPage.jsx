import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FilterIcon, StarIcon } from '../components/Icons.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { ANALYSIS_CATEGORIES, getAnalysisArticles } from '../data/analysis.js';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import { localizeArticle } from '../i18n/localize.js';

const PAGE_SIZE = 3;

function AnalysisCard({ article }) {
  const { t } = useLanguage();
  const localized = localizeArticle(article, t);

  return (
    <article className="analysis-card">
      <div className="analysis-card-meta">
        <span className="analysis-card-badge">{t(`analysis.cat.${article.category}`, article.categoryLabel)}</span>
        <p className="analysis-card-time">{t('common.minutesAgo', { n: 18 })}</p>
      </div>
      <Link className="analysis-card-media" to={`/analysis/${article.slug}`}>
        <img src={article.thumbnail} alt="" />
      </Link>
      <h2>
        <Link to={`/analysis/${article.slug}`}>{localized.cardTitle}</Link>
      </h2>
      <p className="analysis-card-excerpt">{localized.excerpt}</p>
      <div className="analysis-card-foot">
        <div className="analysis-author">
          <span className="analysis-avatar" aria-hidden="true">{article.author.initials}</span>
          <div>
            <strong>{article.author.name}</strong>
            <span>{article.publishedLabel}</span>
          </div>
        </div>
        <Link className="btn btn-lime btn-explore" to={`/analysis/${article.slug}`}>
          {t('common.readArticle')}
          <ArrowUpRight size={10} />
        </Link>
      </div>
    </article>
  );
}

export default function AnalysisPage() {
  const { t } = useLanguage();
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const articles = useMemo(() => getAnalysisArticles(category), [category]);
  const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = articles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [category]);

  return (
    <div className="page analysis-page">
      <section className="analysis-hero">
        <div className="wrap">
          <h1>{t('analysis.heroTitle')}</h1>
          <p>{t('analysis.heroLede')}</p>
        </div>
      </section>

      <section className="analysis-toolbar">
        <div className="wrap">
          <div className="analysis-toolbar-inner" role="tablist" aria-label={t('analysis.topic')}>
            {ANALYSIS_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={category === item.id}
                className={category === item.id ? 'is-active' : ''}
                onClick={() => setCategory(item.id)}
              >
                {category === item.id ? <StarIcon /> : null}
                {t(`analysis.cat.${item.id}`, item.label)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="analysis-board">
        <div className="wrap">
          <div className="analysis-board-panel">
            <div className="analysis-board-head">
              <div>
                <p className="analysis-kicker">{t('analysis.fresh')}</p>
                <h2>{t('analysis.desk')}</h2>
              </div>
              <p className="analysis-sort">
                <FilterIcon />
                {t('common.newestFirst')}
              </p>
            </div>
            <div className="analysis-grid">
              {visible.map((article) => (
                <AnalysisCard key={article.id} article={article} />
              ))}
            </div>
            <div className="pagination">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                {t('common.previous')}
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  className={currentPage === index + 1 ? 'is-active' : ''}
                  onClick={() => setPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                {t('common.next')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
