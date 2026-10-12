const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for forbidden access (403)
 * Used when user is authenticated but not authorized for resource
 */
class ForbiddenException extends BaseException {
    constructor(message = 'Forbidden') {
        super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
    }
}

module.exports = ForbiddenException;
