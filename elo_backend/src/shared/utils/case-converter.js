/**
 * Utility class for converting between camelCase and snake_case
 */
class CaseConverter {
    /**
     * Convert camelCase object to snake_case for database operations
     * @param {Object} obj - Object with camelCase keys
     * @returns {Object} Object with snake_case keys
     */
    static toSnakeCase(obj) {
        if (obj == null) {
            return obj;
        }

        if (typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.toSnakeCase(item));
        }

        const snakeCaseObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                snakeCaseObj[snakeKey] = this.toSnakeCase(obj[key]);
            }
        }

        return snakeCaseObj;
    }

    /**
     * Convert snake_case object to camelCase for API responses
     * @param {Object} obj - Object with snake_case keys
     * @returns {Object} Object with camelCase keys
     */
    static toCamelCase(obj) {
        if (obj == null) {
            return obj;
        }

        if (typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.toCamelCase(item));
        }

        const camelCaseObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                camelCaseObj[camelKey] = this.toCamelCase(obj[key]);
            }
        }

        return camelCaseObj;
    }

    /**
     * Convert database results (snake_case) to camelCase for API responses
     * @param {Array|Object} data - Database results
     * @returns {Array|Object} Data with camelCase keys
     */
    static fromDb(data) {
        return this.toCamelCase(data);
    }

    /**
     * Convert API request data (camelCase) to snake_case for database operations
     * @param {Object} data - Request data
     * @returns {Object} Data with snake_case keys
     */
    static toDb(data) {
        return this.toSnakeCase(data);
    }
}

module.exports = CaseConverter;
