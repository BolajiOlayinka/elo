const express = require('express');
const UploadController = require('./upload.controller');
const AuthMiddleware = require('../../shared/middleware/auth');
const Validator = require('../../shared/middleware/validation');
const { upload_schema } = require('../analysis/dto/analysis.dto');

const router = express.Router();

router.post(
    '/',
    AuthMiddleware.authenticate,
    AuthMiddleware.restrictTo('admin', 'editor'),
    Validator.middleware({ body: upload_schema }),
    UploadController.create
);

module.exports = router;
