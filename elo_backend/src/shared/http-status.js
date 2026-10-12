/**
 * HTTP Status Codes enumeration
 * Provides standardized status codes for HTTP responses
 */
const HttpStatus = Object.freeze({
    // 2xx Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // 3xx Redirection
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,

    // 4xx Client Error
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx Server Error
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
});

/**
 * Get status message for a status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Status message
 */
HttpStatus.getMessage = function (statusCode) {
    const statusMessages = {
        [HttpStatus.OK]: 'OK',
        [HttpStatus.CREATED]: 'Created',
        [HttpStatus.ACCEPTED]: 'Accepted',
        [HttpStatus.NO_CONTENT]: 'No Content',
        [HttpStatus.MOVED_PERMANENTLY]: 'Moved Permanently',
        [HttpStatus.FOUND]: 'Found',
        [HttpStatus.NOT_MODIFIED]: 'Not Modified',
        [HttpStatus.BAD_REQUEST]: 'Bad Request',
        [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
        [HttpStatus.FORBIDDEN]: 'Forbidden',
        [HttpStatus.NOT_FOUND]: 'Not Found',
        [HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
        [HttpStatus.CONFLICT]: 'Conflict',
        [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
        [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
        [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
        [HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
        [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
        [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
        [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout'
    };

    return statusMessages[statusCode] || 'Unknown Status';
};

/**
 * Check if status code is a success code (2xx)
 * @param {number} statusCode - HTTP status code
 * @returns {boolean} True if success code
 */
HttpStatus.isSuccess = function (statusCode) {
    return statusCode >= 200 && statusCode < 300;
};

/**
 * Check if status code is a client error code (4xx)
 * @param {number} statusCode - HTTP status code
 * @returns {boolean} True if client error code
 */
HttpStatus.isClientError = function (statusCode) {
    return statusCode >= 400 && statusCode < 500;
};

/**
 * Check if status code is a server error code (5xx)
 * @param {number} statusCode - HTTP status code
 * @returns {boolean} True if server error code
 */
HttpStatus.isServerError = function (statusCode) {
    return statusCode >= 500 && statusCode < 600;
};

module.exports = HttpStatus;
