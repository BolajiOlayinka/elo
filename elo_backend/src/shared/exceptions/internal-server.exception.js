const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for internal server errors (500)
 * Used when something unexpected happens on the server
 */
class InternalServerException extends BaseException {
    constructor(message = 'Internal server error') {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR');
    }
}

module.exports = InternalServerException;
