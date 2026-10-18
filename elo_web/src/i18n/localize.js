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
    body: (article.body || []).map((block, index) => ({
      ...block,
      heading: t(`essay.${article.id}.h${index}`, block.heading),
      text: t(`essay.${article.id}.p${index}`, block.text)
    })),
    metrics: (article.metrics || []).map((metric) => ({
      ...metric,
      label: t(`metric.${metric.id}`, metric.label)
    }))
  };
}
