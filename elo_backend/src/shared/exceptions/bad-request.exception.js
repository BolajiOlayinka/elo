const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for bad requests (400)
 * Used when client sends invalid request
 */
class BadRequestException extends BaseException {
    constructor(message = 'Bad request') {
        super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST');
    }
}

module.exports = BadRequestException;
