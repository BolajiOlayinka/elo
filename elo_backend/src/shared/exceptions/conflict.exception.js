const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for conflict situations (409)
 * Used when request conflicts with current state of resource
 */
class ConflictException extends BaseException {
    constructor(message = 'Conflict') {
        super(message, HttpStatus.CONFLICT, 'CONFLICT');
    }
}

module.exports = ConflictException;
