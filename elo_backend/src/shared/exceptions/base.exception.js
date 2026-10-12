const HttpStatus = require('../http-status');

/**
 * Base Exception class that extends Error
 * All custom exceptions should extend this class
 */
class BaseException extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} code - Error code for programmatic handling
     */
    constructor(message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, code = 'INTERNAL_ERROR') {
        super(message);
        
        // Ensure proper prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
        
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        // Capture stack trace, maintaining proper stack trace for subclassing
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }

    /**
     * Convert exception to JSON response format
     * @returns {Object} JSON response object
     */
    toJSON() {
        return {
            error: true,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            name: this.name,
            stack: this.stack
        };
    }

    /**
     * Get formatted stack trace
     * @returns {string} Formatted stack trace
     */
    getStackTrace() {
        return this.stack || 'No stack trace available';
    }

    /**
     * Check if this is an operational error (expected business logic error)
     * @returns {boolean} True if operational error
     */
    isOperationalError() {
        return this.isOperational;
    }
}

module.exports = BaseException;
