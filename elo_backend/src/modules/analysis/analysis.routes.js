const express = require('express');
const AnalysisController = require('./analysis.controller');
const AuthMiddleware = require('../../shared/middleware/auth');
const Validator = require('../../shared/middleware/validation');
const {
    category_schema,
    tag_schema,
    post_schema,
    comment_schema,
    comment_moderation_schema,
    vote_schema
} = require('./dto/analysis.dto');

const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.get('/categories', AnalysisController.listCategories);
publicRouter.get('/tags', AnalysisController.listTags);
publicRouter.get('/posts', AnalysisController.listPublicPosts);
publicRouter.get('/posts/discussed', AnalysisController.discussedPosts);
publicRouter.get('/posts/:slug', AnalysisController.getPublicPost);
publicRouter.get('/posts/:slug/related', AnalysisController.relatedPosts);
publicRouter.get('/posts/:slug/comments', AnalysisController.listPublicComments);
publicRouter.post(
    '/posts/:slug/comments',
    AuthMiddleware.optional,
    Validator.middleware({ body: comment_schema }),
    AnalysisController.createComment
);
publicRouter.post(
    '/comments/:id/vote',
    Validator.middleware({ body: vote_schema }),
    AnalysisController.voteComment
);

adminRouter.use(AuthMiddleware.authenticate, AuthMiddleware.restrictTo('admin', 'editor'));
adminRouter.get('/categories', AnalysisController.listCategories);
adminRouter.post('/categories', Validator.middleware({ body: category_schema }), AnalysisController.createCategory);
adminRouter.patch('/categories/:id', Validator.middleware({ body: category_schema }), AnalysisController.updateCategory);
adminRouter.delete('/categories/:id', AnalysisController.deleteCategory);
adminRouter.get('/tags', AnalysisController.listTags);
adminRouter.post('/tags', Validator.middleware({ body: tag_schema }), AnalysisController.createTag);
adminRouter.patch('/tags/:id', Validator.middleware({ body: tag_schema }), AnalysisController.updateTag);
adminRouter.delete('/tags/:id', AnalysisController.deleteTag);
adminRouter.get('/posts', AnalysisController.listAdminPosts);
adminRouter.post('/posts', Validator.middleware({ body: post_schema }), AnalysisController.createPost);
adminRouter.get('/posts/:id', AnalysisController.getAdminPost);
adminRouter.patch('/posts/:id', Validator.middleware({ body: post_schema }), AnalysisController.updatePost);
adminRouter.delete('/posts/:id', AnalysisController.deletePost);
adminRouter.get('/comments', AnalysisController.listComments);
adminRouter.patch(
    '/comments/:id',
    Validator.middleware({ body: comment_moderation_schema }),
    AnalysisController.moderateComment
);
adminRouter.delete('/comments/:id', AnalysisController.deleteComment);

module.exports = {
    publicAnalysisRouter: publicRouter,
    adminAnalysisRouter: adminRouter
};
