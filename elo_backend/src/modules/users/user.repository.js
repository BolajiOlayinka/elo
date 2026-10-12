const db = require('../../infra/database');

class UserRepository {
    /**
     * Create a new user record
     * @param {Object} userData - User data object
     * @param {string} userData.first_name - User's first name
     * @param {string} userData.last_name - User's last name
     * @param {string} userData.email - User's email (unique)
     * @param {string} [userData.password] - User's password
     * @param {string} [userData.phone] - User's phone number
     * @param {string} [userData.address] - User's address
     * @param {string} [userData.city] - User's city
     * @param {string} [userData.state] - User's state
     * @param {string} [userData.zip_code] - User's zip code
     * @param {string} [userData.country] - User's country
     * @returns {Promise<Object>} Created user record
     */
    static async create(userData) {
        const [userRecord] = await db('users')
            .insert(userData)
            .returning('*');
        
        return userRecord;
    }

    /**
     * Find a user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object|null>} User record or null if not found
     */
    static async findById(id) {
        const userRecord = await db('users')
            .where({ id })
            .first();
        
        return userRecord || null;
    }

    /**
     * Find a user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User record or null if not found
     */
    static async findByEmail(email) {
        const userRecord = await db('users')
            .where({ email })
            .first();
        
        return userRecord || null;
    }

    /**
     * Get all users with optional pagination
     * @param {Object} options - Query options
     * @param {number} [options.page=1] - Page number
     * @param {number} [options.limit=10] - Items per page
     * @returns {Promise<Object>} Paginated users list
     */
    static async findAll(options = {}) {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        const [users, totalCount] = await Promise.all([
            db('users')
                .select('*')
                .limit(limit)
                .offset(offset)
                .orderBy('created_at', 'desc'),
            db('users').count('* as count').first()
        ]);

        return {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount.count),
                totalPages: Math.ceil(totalCount.count / limit)
            }
        };
    }

    /**
     * Update a user by ID
     * @param {string} id - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated user record or null if not found
     */
    static async update(id, updateData) {
        const [updatedUserRecord] = await db('users')
            .where({ id })
            .update({
                ...updateData,
                updated_at: db.fn.now()
            })
            .returning('*');
        
        return updatedUserRecord || null;
    }

    /**
     * Delete a user by ID
     * @param {string} id - User ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    static async delete(id) {
        const deletedCount = await db('users')
            .where({ id })
            .del();
        
        return deletedCount > 0;
    }

    /**
     * Check if a user exists by email
     * @param {string} email - User email
     * @returns {Promise<boolean>} True if exists, false otherwise
     */
    static async existsByEmail(email) {
        const userRecord = await db('users')
            .where({ email })
            .first();
        
        return !!userRecord;
    }

    /**
     * Search users by name or email
     * @param {string} searchTerm - Search term
     * @param {Object} options - Query options
     * @param {number} [options.page=1] - Page number
     * @param {number} [options.limit=10] - Items per page
     * @returns {Promise<Object>} Paginated search results
     */
    static async search(searchTerm, options = {}) {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        const query = db('users')
            .where('first_name', 'ilike', `%${searchTerm}%`)
            .orWhere('last_name', 'ilike', `%${searchTerm}%`)
            .orWhere('email', 'ilike', `%${searchTerm}%`);

        const [users, totalCount] = await Promise.all([
            query.clone()
                .select('*')
                .limit(limit)
                .offset(offset)
                .orderBy('created_at', 'desc'),
            query.clone().count('* as count').first()
        ]);

        return {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount.count),
                totalPages: Math.ceil(totalCount.count / limit)
            }
        };
    }
}

module.exports = UserRepository;
