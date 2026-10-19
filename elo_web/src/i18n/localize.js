import { bodyToMarkdown } from '../data/analysis.js';

function localizeBody(article, t) {
  const parts = [];

  for (let index = 0; index < 12; index += 1) {
    const heading = t(`essay.${article.id}.h${index}`, '');
    const text = t(`essay.${article.id}.p${index}`, '');

    if (!heading && !text) {
      break;
    }

    if (heading) {
      parts.push(`## ${heading}`);
    }

    if (text) {
      parts.push(text);
    }
  }

  return parts.length ? parts.join('\n\n') : bodyToMarkdown(article.body);
}

export function localizeArticle(article, t) {
  if (!article) {
    return article;
  }

  return {
    ...article,
    title: t(`essay.${article.id}.title`, article.title),
    cardTitle: t(`essay.${article.id}.cardTitle`, article.cardTitle || article.title),
    excerpt: t(`essay.${article.id}.excerpt`, article.excerpt),
    categoryLabel: t(`analysis.cat.${article.category}`, article.categoryLabel),
    body: localizeBody(article, t),
    metrics: (Array.isArray(article.metrics) ? article.metrics : []).map((metric) => ({
      ...metric,
      label: t(`metric.${metric.id}`, metric.label)
    }))
  };
}
