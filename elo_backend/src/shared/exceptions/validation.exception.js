const BaseException = require('./base.exception');
const HttpStatus = require('../http-status');

/**
 * Exception for validation errors (422)
 * Used when input validation fails
 */
class ValidationException extends BaseException {
    constructor(message = 'Validation failed', details = null) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
        this.details = details;
    }

    /**
     * Convert exception to JSON response format
     * @returns {Object} JSON response object
     */
    toJSON() {
        const response = super.toJSON();
        if (this.details) {
            response.details = this.details;
        }
        
        return response;
    }
}

module.exports = ValidationException;
