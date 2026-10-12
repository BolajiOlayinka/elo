const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for resource not found (404)
 * Used when a requested resource doesn't exist
 */
class NotFoundException extends BaseException {
    constructor(message = 'Resource not found') {
        super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND');
    }
}

module.exports = NotFoundException;
