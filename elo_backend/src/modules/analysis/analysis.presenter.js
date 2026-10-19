function formatWhen(date) {
    if (!date) {
        return '';
    }

    const value = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(value.getTime())) {
        return '';
    }

    const diff = Date.now() - value.getTime();
    const minutes = Math.round(diff / 60000);

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.round(hours / 24);

    if (days < 14) {
        return `${days}d ago`;
    }

    return value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function publishedLabel(date) {
    if (!date) {
        return '';
    }

    const value = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(value.getTime())) {
        return '';
    }

    return value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function presentCategory(row) {
    return {
        id: row.id,
        slug: row.slug,
        label: row.label,
        description: row.description || '',
        sortOrder: row.sort_order
    };
}

function presentTag(row) {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name
    };
}

function presentMedia(uploadId, fileUrl) {
    return {
        upload_id: uploadId || '',
        file_url: fileUrl || ''
    };
}

function presentPost(row, extras = {}) {
    const tags = extras.tags || row.tags || [];

    return {
        id: row.id,
        slug: row.slug,
        category: extras.categorySlug || row.category_slug,
        categoryId: row.category_id,
        categoryLabel: extras.categoryLabel || row.category_label,
        comparison: Boolean(row.comparison),
        title: row.title,
        cardTitle: row.card_title,
        excerpt: row.excerpt || '',
        readMinutes: row.read_minutes,
        arguments: row.arguments_count,
        clips: row.clips,
        publishedAt: row.published_at,
        publishedLabel: publishedLabel(row.published_at),
        author: {
            name: row.author_name,
            role: row.author_role || '',
            initials: row.author_initials || ''
        },
        thumbnail: presentMedia(row.thumbnail_upload_id, row.thumbnail_url),
        hero: presentMedia(row.hero_upload_id, row.hero_url),
        metrics: Array.isArray(row.metrics) ? row.metrics : [],
        metricNames: {
            left: row.metric_left_name || '',
            right: row.metric_right_name || ''
        },
        body: row.body || '',
        tags: tags.map((tag) => (typeof tag === 'string' ? tag : tag.slug || tag.name)),
        tagRecords: tags.map((tag) => (typeof tag === 'string' ? { slug: tag, name: tag } : presentTag(tag))),
        translations: row.translations || {},
        status: row.status,
        updatedAt: row.updated_at,
        comments: extras.comments
    };
}

function presentComment(row, extras = {}) {
    return {
        id: row.id,
        essayId: row.post_id,
        essaySlug: extras.essaySlug || row.post_slug || '',
        essayTitle: extras.essayTitle || row.post_title || '',
        parentId: row.parent_id || null,
        userId: row.user_id || null,
        name: row.name,
        initials: row.initials || '',
        email: row.email || '',
        createdAt: row.created_at,
        when: formatWhen(row.created_at),
        stance: row.stance,
        text: row.body,
        upvotes: row.upvotes,
        downvotes: row.downvotes,
        match: row.match_label
            ? { label: row.match_label, clock: row.match_clock || '' }
            : null,
        status: row.status,
        flagged: Boolean(row.flagged),
        replies: extras.replies || []
    };
}

function nestComments(rows, extras = {}) {
    const byId = new Map();

    rows.forEach((row) => {
        byId.set(row.id, presentComment(row, extras));
    });

    const roots = [];

    byId.forEach((comment) => {
        if (comment.parentId && byId.has(comment.parentId)) {
            byId.get(comment.parentId).replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    return roots;
}

module.exports = {
    presentCategory,
    presentTag,
    presentPost,
    presentComment,
    nestComments,
    formatWhen,
    publishedLabel
};
