const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for unprocessable entity (422)
 * Used when request syntax is correct but semantic errors exist
 */
class UnprocessableEntityException extends BaseException {
    constructor(message = 'Unprocessable entity') {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'UNPROCESSABLE_ENTITY');
    }
}

module.exports = UnprocessableEntityException;
