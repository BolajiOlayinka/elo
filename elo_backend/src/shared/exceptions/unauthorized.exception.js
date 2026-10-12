const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for unauthorized access (401)
 * Used when authentication is required but not provided or invalid
 */
class UnauthorizedException extends BaseException {
    constructor(message = 'Unauthorized') {
        super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
    }
}

module.exports = UnauthorizedException;
