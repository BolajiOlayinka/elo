const UserRepository = require('./user.repository');
const {
    ConflictException,
    NotFoundException,
    BadRequestException
} = require('../../shared/exceptions');

class UserService {
    /**
     * Create a new user with validation
     * @param {Object} userData - User data object
     * @returns {Promise<Object>} Created user record
     */
    static async createUser(userData) {
        return await UserRepository.create(userData);
    }

    /**
     * Get user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object|null>} User record or null
     */
    static async getUserById(id) {
        return await UserRepository.findById(id);
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User record or null
     */
    static async getUserByEmail(email) {
        return await UserRepository.findByEmail(email);
    }

    /**
     * Get all users with pagination
     * @param {Object} options - Query options
     * @param {number} [options.page=1] - Page number
     * @param {number} [options.limit=10] - Items per page
     * @returns {Promise<Object>} Paginated users list
     */
    static async getAllUsers(options = {}) {
        return await UserRepository.findAll(options);
    }

    /**
     * Update user information
     * @param {string} id - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated user record or null
     * @throws {Error} If user doesn't exist
     */
    static async updateUser(id, updateData) {
        const existingUser = await UserRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // If email is being updated, check for duplicates
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await UserRepository.existsByEmail(updateData.email);
            if (emailExists) {
                throw new ConflictException('Email already in use by another user');
            }
        }

        const updatedUser = await UserRepository.update(id, updateData);

        return {
            ...existingUser,
            ...updatedUser
        };
    }

    /**
     * Delete user by ID
     * @param {string} id - User ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     * @throws {Error} If user doesn't exist
     */
    static async deleteUser(id) {
        const existingUser = await UserRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        return await UserRepository.delete(id);
    }

    /**
     * Search users by name or email
     * @param {string} searchTerm - Search term
     * @param {Object} options - Query options
     * @param {number} [options.page=1] - Page number
     * @param {number} [options.limit=10] - Items per page
     * @returns {Promise<Object>} Paginated search results
     */
    static async searchUsers(searchTerm, options = {}) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            throw new BadRequestException('Search term is required');
        }

        return await UserRepository.search(searchTerm.trim(), options);
    }

    /**
     * Get user statistics
     * @returns {Promise<Object>} User statistics
     */
    static async getUserStats() {
        const allUsers = await UserRepository.findAll({ limit: 1000 });
        const totalUsers = allUsers.pagination.total;

        // You can add more statistics here as needed
        return {
            totalUsers
            // Add more stats like:
            // usersWithPhone: allUsers.users.filter(p => p.phone).length,
            // usersByCountry: this.groupByCountry(allUsers.users)
        };
    }
}

module.exports = UserService;
