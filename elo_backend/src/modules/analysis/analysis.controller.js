const AnalysisService = require('./analysis.service');

class AnalysisController {
    static async listCategories(req, res) {
        const categories = await AnalysisService.listCategories();

        res.json({
            success: true,
            message: 'Categories',
            data: { categories }
        });
    }

    static async createCategory(req, res) {
        const category = await AnalysisService.createCategory(req.body);

        res.status(201).json({
            success: true,
            message: 'Category created',
            data: { category }
        });
    }

    static async updateCategory(req, res) {
        const category = await AnalysisService.updateCategory(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Category updated',
            data: { category }
        });
    }

    static async deleteCategory(req, res) {
        await AnalysisService.deleteCategory(req.params.id);

        res.json({
            success: true,
            message: 'Category deleted',
            data: { id: req.params.id }
        });
    }

    static async listTags(req, res) {
        const tags = await AnalysisService.listTags();

        res.json({
            success: true,
            message: 'Tags',
            data: { tags }
        });
    }

    static async createTag(req, res) {
        const tag = await AnalysisService.createTag(req.body);

        res.status(201).json({
            success: true,
            message: 'Tag created',
            data: { tag }
        });
    }

    static async updateTag(req, res) {
        const tag = await AnalysisService.updateTag(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Tag updated',
            data: { tag }
        });
    }

    static async deleteTag(req, res) {
        await AnalysisService.deleteTag(req.params.id);

        res.json({
            success: true,
            message: 'Tag deleted',
            data: { id: req.params.id }
        });
    }

    static async listPublicPosts(req, res) {
        const posts = await AnalysisService.listPosts({
            status: 'published',
            categorySlug: req.query.category,
            tagSlug: req.query.tag
        });

        res.json({
            success: true,
            message: 'Posts',
            data: { posts }
        });
    }

    static async listAdminPosts(req, res) {
        const posts = await AnalysisService.listPosts({
            status: req.query.status,
            categorySlug: req.query.category,
            tagSlug: req.query.tag
        });

        res.json({
            success: true,
            message: 'Posts',
            data: { posts }
        });
    }

    static async getAdminPost(req, res) {
        const post = await AnalysisService.getPostById(req.params.id);

        res.json({
            success: true,
            message: 'Post',
            data: { post }
        });
    }

    static async getPublicPost(req, res) {
        const post = await AnalysisService.getPublishedPost(req.params.slug);

        res.json({
            success: true,
            message: 'Post',
            data: { post }
        });
    }

    static async relatedPosts(req, res) {
        const posts = await AnalysisService.relatedPosts(req.params.slug);

        res.json({
            success: true,
            message: 'Related posts',
            data: { posts }
        });
    }

    static async discussedPosts(req, res) {
        const posts = await AnalysisService.discussedPosts();

        res.json({
            success: true,
            message: 'Discussed posts',
            data: { posts }
        });
    }

    static async createPost(req, res) {
        const post = await AnalysisService.createPost(req.body, req.user);

        res.status(201).json({
            success: true,
            message: 'Post created',
            data: { post }
        });
    }

    static async updatePost(req, res) {
        const post = await AnalysisService.updatePost(req.params.id, req.body, req.user);

        res.json({
            success: true,
            message: 'Post updated',
            data: { post }
        });
    }

    static async deletePost(req, res) {
        await AnalysisService.deletePost(req.params.id);

        res.json({
            success: true,
            message: 'Post deleted',
            data: { id: req.params.id }
        });
    }

    static async listPublicComments(req, res) {
        const post = await AnalysisService.getPublishedPost(req.params.slug);

        res.json({
            success: true,
            message: 'Comments',
            data: { comments: post.comments || [] }
        });
    }

    static async listComments(req, res) {
        const comments = await AnalysisService.listComments({
            postId: req.query.postId,
            status: req.query.status
        });

        res.json({
            success: true,
            message: 'Comments',
            data: { comments }
        });
    }

    static async createComment(req, res) {
        const comment = await AnalysisService.createPublicComment(req.params.slug, req.body, req.user);

        res.status(201).json({
            success: true,
            message: 'Comment added',
            data: { comment }
        });
    }

    static async voteComment(req, res) {
        const comment = await AnalysisService.voteComment(req.params.id, req.body.direction);

        res.json({
            success: true,
            message: 'Vote recorded',
            data: { comment }
        });
    }

    static async moderateComment(req, res) {
        const comment = await AnalysisService.moderateComment(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Comment updated',
            data: { comment }
        });
    }

    static async deleteComment(req, res) {
        await AnalysisService.deleteComment(req.params.id);

        res.json({
            success: true,
            message: 'Comment deleted',
            data: { id: req.params.id }
        });
    }
}

module.exports = AnalysisController;
