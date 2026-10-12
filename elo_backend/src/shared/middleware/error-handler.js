const env = require('../../config/env');
const BaseException = require('../exceptions/base.exception');
const HttpStatus = require('../http-status');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message;

    if (err instanceof BaseException) {
        statusCode = err.statusCode;
        message = err.message;
    }

    res.status(statusCode).json({
        error: true,
        message
    });
};

module.exports = errorHandler;
