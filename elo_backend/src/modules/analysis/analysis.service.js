const crypto = require('crypto');
const AnalysisRepository = require('./analysis.repository');
const {
    presentCategory,
    presentTag,
    presentPost,
    presentComment,
    nestComments
} = require('./analysis.presenter');
const {
    BadRequestException,
    ConflictException,
    NotFoundException
} = require('../../shared/exceptions');

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function initialsFrom(name) {
    return String(name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'ES';
}

function normalizeMedia(value) {
    if (!value) {
        return { upload_id: '', file_url: '' };
    }

    if (typeof value === 'string') {
        return { upload_id: '', file_url: value };
    }

    return {
        upload_id: value.upload_id || value.uploadId || '',
        file_url: value.file_url || value.fileUrl || ''
    };
}

async function attachTags(posts) {
    const ids = posts.map((post) => post.id);
    const rows = await AnalysisRepository.tagsForPosts(ids);
    const byPost = new Map();

    rows.forEach((row) => {
        const list = byPost.get(row.post_id) || [];
        list.push({ id: row.id, slug: row.slug, name: row.name });
        byPost.set(row.post_id, list);
    });

    return posts.map((post) => presentPost(post, { tags: byPost.get(post.id) || [] }));
}

async function uniqueSlug(tableLookup, base, excludeId) {
    const root = slugify(base) || `item-${crypto.randomUUID().slice(0, 8)}`;
    let candidate = root;
    let index = 2;

    while (true) {
        const existing = await tableLookup(candidate);

        if (!existing || existing.id === excludeId) {
            return candidate;
        }

        candidate = `${root}-${index}`;
        index += 1;
    }
}

function postPayload(input, category, extras = {}) {
    const thumbnail = normalizeMedia(input.thumbnail);
    const hero = normalizeMedia(input.hero);
    const metricNames = input.metricNames || {};
    const status = input.status === 'published' ? 'published' : 'draft';
    const now = new Date();
    const author = input.author || {};

    return {
        slug: extras.slug,
        category_id: category.id,
        title: input.title,
        card_title: input.cardTitle || input.title,
        excerpt: input.excerpt || '',
        body: input.body || '',
        status,
        comparison: Boolean(input.comparison),
        read_minutes: Number(input.readMinutes) || 6,
        clips: Number(input.clips) || 0,
        published_at: status === 'published'
            ? (input.publishedAt ? new Date(input.publishedAt) : extras.existingPublishedAt || now)
            : null,
        author_name: author.name || extras.authorName || 'EloStats Desk',
        author_role: author.role || extras.authorRole || 'Editor',
        author_initials: author.initials || extras.authorInitials || initialsFrom(author.name || extras.authorName),
        thumbnail_upload_id: thumbnail.upload_id || null,
        thumbnail_url: thumbnail.file_url || null,
        hero_upload_id: hero.upload_id || null,
        hero_url: hero.file_url || null,
        metric_left_name: metricNames.left || extras.metricLeft || '',
        metric_right_name: metricNames.right || extras.metricRight || '',
        metrics: JSON.stringify(Array.isArray(input.metrics)
            ? input.metrics
            : (Array.isArray(extras.existingMetrics) ? extras.existingMetrics : [])),
        translations: JSON.stringify(
            input.translations && typeof input.translations === 'object' && !Array.isArray(input.translations)
                ? input.translations
                : (extras.existingTranslations && typeof extras.existingTranslations === 'object'
                    ? extras.existingTranslations
                    : {})
        ),
        updated_at: now
    };
}

async function resolveTagIds(input) {
    const tags = await AnalysisRepository.tags();
    const requested = Array.isArray(input.tags) ? input.tags : [];
    const ids = [];

    requested.forEach((value) => {
        if (!value) {
            return;
        }

        const match = tags.find((tag) => tag.id === value || tag.slug === value || tag.name === value);

        if (match) {
            ids.push(match.id);
        }
    });

    return [...new Set(ids)];
}

class AnalysisService {
    static async listCategories() {
        const rows = await AnalysisRepository.categories();

        return rows.map(presentCategory);
    }

    static async createCategory(input) {
        if (!input.label) {
            throw new BadRequestException('Category name is required');
        }

        const slug = await uniqueSlug(
            (value) => AnalysisRepository.categoryBySlug(value),
            input.slug || input.label
        );
        const [row] = await AnalysisRepository.insertCategory({
            slug,
            label: input.label,
            description: input.description || '',
            sort_order: Number(input.sortOrder) || 0,
            updated_at: new Date()
        });

        return presentCategory(row);
    }

    static async updateCategory(id, input) {
        const current = await AnalysisRepository.categoryById(id);

        if (!current) {
            throw new NotFoundException('Category not found');
        }

        const slug = await uniqueSlug(
            (value) => AnalysisRepository.categoryBySlug(value),
            input.slug || input.label || current.slug,
            id
        );
        const [row] = await AnalysisRepository.updateCategory(id, {
            slug,
            label: input.label ?? current.label,
            description: input.description ?? current.description,
            sort_order: input.sortOrder == null ? current.sort_order : Number(input.sortOrder),
            updated_at: new Date()
        });

        return presentCategory(row);
    }

    static async deleteCategory(id) {
        const current = await AnalysisRepository.categoryById(id);

        if (!current) {
            throw new NotFoundException('Category not found');
        }

        const usage = await AnalysisRepository.countPostsByCategory(id);

        if (Number(usage?.count) > 0) {
            throw new ConflictException('Move or delete posts in this category first');
        }

        await AnalysisRepository.deleteCategory(id);

        return { id };
    }

    static async listTags() {
        const rows = await AnalysisRepository.tags();

        return rows.map(presentTag);
    }

    static async createTag(input) {
        if (!input.name) {
            throw new BadRequestException('Tag name is required');
        }

        const slug = await uniqueSlug(
            (value) => AnalysisRepository.tagBySlug(value),
            input.slug || input.name
        );
        const [row] = await AnalysisRepository.insertTag({
            slug,
            name: input.name,
            updated_at: new Date()
        });

        return presentTag(row);
    }

    static async updateTag(id, input) {
        const current = await AnalysisRepository.tagById(id);

        if (!current) {
            throw new NotFoundException('Tag not found');
        }

        const slug = await uniqueSlug(
            (value) => AnalysisRepository.tagBySlug(value),
            input.slug || input.name || current.slug,
            id
        );
        const [row] = await AnalysisRepository.updateTag(id, {
            slug,
            name: input.name ?? current.name,
            updated_at: new Date()
        });

        return presentTag(row);
    }

    static async deleteTag(id) {
        const current = await AnalysisRepository.tagById(id);

        if (!current) {
            throw new NotFoundException('Tag not found');
        }

        await AnalysisRepository.deleteTag(id);

        return { id };
    }

    static async listPosts(filters = {}) {
        const rows = await AnalysisRepository.postsQuery(filters);

        return attachTags(rows);
    }

    static async getPostById(id) {
        const row = await AnalysisRepository.postById(id);

        if (!row) {
            throw new NotFoundException('Post not found');
        }

        const [presented] = await attachTags([row]);

        return presented;
    }

    static async getPublishedPost(slug) {
        const row = await AnalysisRepository.postBySlug(slug);

        if (!row || row.status !== 'published') {
            throw new NotFoundException('Post not found');
        }

        const [presented] = await attachTags([row]);
        const comments = await AnalysisRepository.comments({ postId: row.id, status: 'approved' });

        return {
            ...presented,
            comments: nestComments(comments, {
                essaySlug: row.slug,
                essayTitle: row.card_title
            })
        };
    }

    static async relatedPosts(slug) {
        const row = await AnalysisRepository.postBySlug(slug);

        if (!row || row.status !== 'published') {
            throw new NotFoundException('Post not found');
        }

        const related = await AnalysisRepository.relatedPosts(row, 3);

        return attachTags(related);
    }

    static async discussedPosts() {
        const rows = await AnalysisRepository.discussedPosts(4);

        return attachTags(rows);
    }

    static async createPost(input, staff) {
        const category = (input.categoryId
            ? await AnalysisRepository.categoryById(input.categoryId)
            : null)
            || (input.category
                ? await AnalysisRepository.categoryBySlug(input.category)
                : null);

        if (!category) {
            throw new BadRequestException('Category is required');
        }

        const slug = await uniqueSlug(
            (value) => AnalysisRepository.postBySlug(value),
            input.slug || input.cardTitle || input.title
        );
        const payload = postPayload(input, category, {
            slug,
            authorName: staff?.first_name ? `${staff.first_name} ${staff.last_name || ''}`.trim() : staff?.email,
            authorRole: 'Editor',
            authorInitials: initialsFrom(staff?.first_name || staff?.email)
        });
        const [created] = await AnalysisRepository.insertPost({
            ...payload,
            id: crypto.randomUUID()
        });
        await AnalysisRepository.replacePostTags(created.id, await resolveTagIds(input));

        return this.getPostById(created.id);
    }

    static async updatePost(id, input, staff) {
        const current = await AnalysisRepository.postById(id);

        if (!current) {
            throw new NotFoundException('Post not found');
        }

        const category = (input.categoryId
            ? await AnalysisRepository.categoryById(input.categoryId)
            : null)
            || (input.category
                ? await AnalysisRepository.categoryBySlug(input.category)
                : null)
            || await AnalysisRepository.categoryById(current.category_id);

        if (!category) {
            throw new BadRequestException('Category is required');
        }

        const slug = input.slug
            ? await uniqueSlug((value) => AnalysisRepository.postBySlug(value), input.slug, id)
            : current.slug;
        await AnalysisRepository.updatePost(id, postPayload(input, category, {
            slug,
            existingPublishedAt: current.published_at,
            existingMetrics: current.metrics,
            existingTranslations: current.translations,
            metricLeft: current.metric_left_name,
            metricRight: current.metric_right_name,
            authorName: current.author_name,
            authorRole: current.author_role,
            authorInitials: current.author_initials
        }));

        if (Array.isArray(input.tags)) {
            await AnalysisRepository.replacePostTags(id, await resolveTagIds(input));
        }

        return this.getPostById(id);
    }

    static async deletePost(id) {
        const current = await AnalysisRepository.postById(id);

        if (!current) {
            throw new NotFoundException('Post not found');
        }

        await AnalysisRepository.deletePost(id);

        return { id };
    }

    static async listComments(filters = {}) {
        const rows = await AnalysisRepository.comments(filters);

        return rows.map((row) => presentComment(row, {
            essaySlug: row.post_slug,
            essayTitle: row.post_title
        }));
    }

    static async createPublicComment(slug, input, user) {
        const post = await AnalysisRepository.postBySlug(slug);

        if (!post || post.status !== 'published') {
            throw new NotFoundException('Post not found');
        }

        if (input.parentId) {
            const parent = await AnalysisRepository.commentById(input.parentId);

            if (!parent || parent.post_id !== post.id) {
                throw new BadRequestException('Reply target was not found');
            }
        }

        const name = input.name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Guest');
        const [row] = await AnalysisRepository.insertComment({
            id: crypto.randomUUID(),
            post_id: post.id,
            parent_id: input.parentId || null,
            user_id: user?.id || null,
            name: name || 'Guest',
            initials: input.initials || initialsFrom(name),
            email: input.email || user?.email || null,
            stance: input.stance || 'challenge',
            body: input.text || input.body,
            match_label: input.match?.label || input.matchLabel || null,
            match_clock: input.match?.clock || input.matchClock || null,
            status: 'approved'
        });

        await AnalysisRepository.incrementArguments(post.id, 1);

        return presentComment({ ...row, post_slug: post.slug, post_title: post.card_title });
    }

    static async voteComment(id, direction) {
        const row = await AnalysisRepository.commentById(id);

        if (!row) {
            throw new NotFoundException('Comment not found');
        }

        const next = { ...row };

        if (direction === 'up') {
            next.upvotes += 1;
        } else if (direction === 'down') {
            next.downvotes += 1;
        } else {
            throw new BadRequestException('Vote must be up or down');
        }

        const [updated] = await AnalysisRepository.updateComment(id, {
            upvotes: next.upvotes,
            downvotes: next.downvotes
        });

        return presentComment({ ...updated, post_slug: row.post_slug, post_title: row.post_title });
    }

    static async moderateComment(id, input) {
        const row = await AnalysisRepository.commentById(id);

        if (!row) {
            throw new NotFoundException('Comment not found');
        }

        const [updated] = await AnalysisRepository.updateComment(id, {
            status: input.status || row.status,
            flagged: input.flagged == null ? row.flagged : Boolean(input.flagged)
        });

        return presentComment({ ...updated, post_slug: row.post_slug, post_title: row.post_title });
    }

    static async deleteComment(id) {
        const row = await AnalysisRepository.commentById(id);

        if (!row) {
            throw new NotFoundException('Comment not found');
        }

        await AnalysisRepository.deleteComment(id);

        return { id };
    }
}

module.exports = AnalysisService;
