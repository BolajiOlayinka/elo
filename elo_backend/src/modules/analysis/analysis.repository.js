const db = require('../../infra/database');

const POST_SELECT = [
    'analysis_posts.*',
    'analysis_categories.slug as category_slug',
    'analysis_categories.label as category_label'
];

class AnalysisRepository {
    static categories() {
        return db('analysis_categories').orderBy([
            { column: 'sort_order', order: 'asc' },
            { column: 'label', order: 'asc' }
        ]);
    }

    static categoryById(id) {
        return db('analysis_categories').where({ id }).first();
    }

    static categoryBySlug(slug) {
        return db('analysis_categories').where({ slug }).first();
    }

    static insertCategory(payload) {
        return db('analysis_categories').insert(payload).returning('*');
    }

    static updateCategory(id, payload) {
        return db('analysis_categories').where({ id }).update(payload).returning('*');
    }

    static deleteCategory(id) {
        return db('analysis_categories').where({ id }).del();
    }

    static countPostsByCategory(categoryId) {
        return db('analysis_posts').where({ category_id: categoryId }).count('id as count').first();
    }

    static tags() {
        return db('analysis_tags').orderBy('name', 'asc');
    }

    static tagById(id) {
        return db('analysis_tags').where({ id }).first();
    }

    static tagBySlug(slug) {
        return db('analysis_tags').where({ slug }).first();
    }

    static insertTag(payload) {
        return db('analysis_tags').insert(payload).returning('*');
    }

    static updateTag(id, payload) {
        return db('analysis_tags').where({ id }).update(payload).returning('*');
    }

    static deleteTag(id) {
        return db('analysis_tags').where({ id }).del();
    }

    static postsQuery({ status, categorySlug, tagSlug } = {}) {
        const query = db('analysis_posts')
            .join('analysis_categories', 'analysis_categories.id', 'analysis_posts.category_id')
            .select(POST_SELECT)
            .orderByRaw('analysis_posts.published_at desc nulls last')
            .orderBy('analysis_posts.updated_at', 'desc');

        if (status) {
            query.where('analysis_posts.status', status);
        }

        if (categorySlug) {
            query.where('analysis_categories.slug', categorySlug);
        }

        if (tagSlug) {
            query.whereIn('analysis_posts.id', function attachTag() {
                this.select('analysis_post_tags.post_id')
                    .from('analysis_post_tags')
                    .join('analysis_tags', 'analysis_tags.id', 'analysis_post_tags.tag_id')
                    .where('analysis_tags.slug', tagSlug);
            });
        }

        return query;
    }

    static postById(id) {
        return db('analysis_posts')
            .join('analysis_categories', 'analysis_categories.id', 'analysis_posts.category_id')
            .select(POST_SELECT)
            .where('analysis_posts.id', id)
            .first();
    }

    static postBySlug(slug) {
        return db('analysis_posts')
            .join('analysis_categories', 'analysis_categories.id', 'analysis_posts.category_id')
            .select(POST_SELECT)
            .where('analysis_posts.slug', slug)
            .first();
    }

    static tagsForPosts(postIds) {
        if (!postIds.length) {
            return Promise.resolve([]);
        }

        return db('analysis_post_tags')
            .join('analysis_tags', 'analysis_tags.id', 'analysis_post_tags.tag_id')
            .whereIn('analysis_post_tags.post_id', postIds)
            .select(
                'analysis_post_tags.post_id',
                'analysis_tags.id',
                'analysis_tags.slug',
                'analysis_tags.name'
            );
    }

    static insertPost(payload) {
        return db('analysis_posts').insert(payload).returning('*');
    }

    static updatePost(id, payload) {
        return db('analysis_posts').where({ id }).update(payload).returning('*');
    }

    static deletePost(id) {
        return db('analysis_posts').where({ id }).del();
    }

    static replacePostTags(postId, tagIds) {
        return db.transaction(async (trx) => {
            await trx('analysis_post_tags').where({ post_id: postId }).del();

            if (tagIds.length) {
                await trx('analysis_post_tags').insert(
                    tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId }))
                );
            }
        });
    }

    static relatedPosts(post, limit = 3) {
        return db('analysis_posts')
            .join('analysis_categories', 'analysis_categories.id', 'analysis_posts.category_id')
            .select(POST_SELECT)
            .where('analysis_posts.status', 'published')
            .whereNot('analysis_posts.id', post.id)
            .where((builder) => {
                builder
                    .where('analysis_posts.category_id', post.category_id)
                    .orWhere('analysis_posts.comparison', post.comparison);
            })
            .orderByRaw('analysis_posts.published_at desc nulls last')
            .limit(limit);
    }

    static discussedPosts(limit = 4) {
        return db('analysis_posts')
            .join('analysis_categories', 'analysis_categories.id', 'analysis_posts.category_id')
            .select(POST_SELECT)
            .where('analysis_posts.status', 'published')
            .orderBy('analysis_posts.arguments_count', 'desc')
            .orderByRaw('analysis_posts.published_at desc nulls last')
            .limit(limit);
    }

    static comments(filters = {}) {
        const query = db('analysis_comments')
            .join('analysis_posts', 'analysis_posts.id', 'analysis_comments.post_id')
            .select(
                'analysis_comments.*',
                'analysis_posts.slug as post_slug',
                'analysis_posts.card_title as post_title'
            )
            .orderBy('analysis_comments.created_at', 'desc');

        if (filters.postId) {
            query.where('analysis_comments.post_id', filters.postId);
        }

        if (filters.status) {
            query.where('analysis_comments.status', filters.status);
        }

        return query;
    }

    static commentById(id) {
        return db('analysis_comments')
            .join('analysis_posts', 'analysis_posts.id', 'analysis_comments.post_id')
            .select(
                'analysis_comments.*',
                'analysis_posts.slug as post_slug',
                'analysis_posts.card_title as post_title'
            )
            .where('analysis_comments.id', id)
            .first();
    }

    static insertComment(payload) {
        return db('analysis_comments').insert(payload).returning('*');
    }

    static updateComment(id, payload) {
        return db('analysis_comments').where({ id }).update(payload).returning('*');
    }

    static deleteComment(id) {
        return db('analysis_comments').where({ id }).del();
    }

    static incrementArguments(postId, amount = 1) {
        return db('analysis_posts').where({ id: postId }).increment('arguments_count', amount);
    }

    static insertUpload(payload) {
        return db('analysis_uploads').insert(payload).returning('*');
    }

    static uploadById(id) {
        return db('analysis_uploads').where({ id }).first();
    }
}

module.exports = AnalysisRepository;
