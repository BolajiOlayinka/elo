const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserService = require('../users/user.service');
const { CacheService } = require('../../infra/cache');
const {
    ConflictException,
    NotFoundException,
    UnauthorizedException,
    BadRequestException,
    UnprocessableEntityException
} = require('../../shared/exceptions');
const EmailService = require('../notification/email/service');
const env = require('../../config/env');
const { generateRandomKey } = require('../../shared/utils/key-generator');

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.first_name - User's first name
     * @param {string} userData.last_name - User's last name
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @param {string} userData.role - User's role (parent or driver)
     * @param {string} [userData.phone] - User's phone number
     * @param {string} [userData.address] - User's address
     * @param {string} [userData.city] - User's city
     * @param {string} [userData.state] - User's state
     * @param {string} [userData.zip_code] - User's zip code
     * @param {string} [userData.country] - User's country
     * @returns {Promise<Object>} Created user record with token
     * @throws {Error} If user with email already exists or role is invalid
     */
    static async signup(user_data) {
        const { email, password, role, ...other_data } = user_data;
        const existing_user = await UserService.getUserByEmail(email);
        if (existing_user) {
            throw new ConflictException('User with this email already exists');
        }

        const hashed_password = await bcrypt.hash(password, 8);

        const roles = [role];

        const new_user = await UserService.createUser({
            ...other_data,
            email,
            password: hashed_password,
            roles
        });

        const verification_code = generateRandomKey(6);

        // Cache the key with 15-minutes TTL (900 seconds)
        await CacheService.set(`signup_key:${verification_code}`, new_user.id, 900);

        EmailService.sendEmailVerificationMail(email, `${other_data.last_name} ${other_data.first_name}`, verification_code);

        delete new_user.password;

        return new_user;
    }

    /**
     * Verify user email with verification code
     * @param {string} verificationCode - 6-digit verification code
     * @returns {Promise<Object>} Updated user record
     * @throws {Error} If verification code is invalid or expired
     */
    static async verifyEmail(verification_code) {
        // Check if the key exists in cache
        const user_id = await CacheService.get(`signup_key:${verification_code}`);

        if (!user_id) {
            throw new BadRequestException('Invalid or expired verification code');
        }

        const user = await UserService.updateUser(user_id, { is_verified: true });

        EmailService.sendWelcomeMail(
            user.email,
            `${user.last_name} ${user.first_name}`
        );

        await CacheService.del(`signup_key:${verification_code}`);

        delete user.password;

        return user;
    }

    /**
     * Resend verification email to user
     * @param {string} email - User's email address
     * @returns {Promise<Object>} Result with email sent confirmation
     * @throws {Error} If user not found or already verified
     */
    static async resendVerification(email) {
        const user = await UserService.getUserByEmail(email);

        if (user.is_verified) {
            throw new BadRequestException('Account is already verified');
        }

        const verification_code = generateRandomKey(6);

        // Cache the key with 15-minutes TTL (900 seconds)
        await CacheService.set(`signup_key:${verification_code}`, user.id, 900);

        // Fire and forget email sending - don't block response
        EmailService.sendEmailVerificationMail(
            email,
            `${user.last_name} ${user.first_name}`,
            verification_code
        );
    }

    /**
     * Authenticate user and return token
     * @param {Object} loginData - Login credentials
     * @param {string} loginData.email - User's email
     * @param {string} loginData.password - User's password
     * @param {string} loginData.role - User's role for this session (parent or driver)
     * @returns {Promise<Object>} User record with token
     * @throws {Error} If credentials are invalid or user doesn't have the requested role
     */
    static async login(login_data) {
        const { email, password, role } = login_data;

        if (!['parent', 'driver'].includes(role)) {
            throw new UnprocessableEntityException('Role must be either parent or driver');
        }

        const user = await UserService.getUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const is_password_valid = await bcrypt.compare(password, user.password);
        if (!is_password_valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.is_verified) {
            throw new UnauthorizedException('Account is not verified');
        }

        const user_roles = user.roles;
        if (!user_roles.includes(role)) {
            throw new UnauthorizedException('User does not have the requested role');
        }

        const token = this.generateToken(user, role);

        const user_without_password = { ...user };
        delete user_without_password.password;

        return {
            user: user_without_password,
            token
        };
    }

    static async staffLogin({ email, password }) {
        const user = await UserService.getUserByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const is_password_valid = await bcrypt.compare(password, user.password);

        if (!is_password_valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const staff_roles = ['admin', 'editor'];
        const matched = (user.roles || []).find((role) => staff_roles.includes(role));

        if (!matched) {
            throw new UnauthorizedException('Staff access required');
        }

        const token = this.generateToken(user, matched);
        const user_without_password = { ...user };
        delete user_without_password.password;

        return {
            user: user_without_password,
            token
        };
    }

    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @param {string} currentRole - Current role for this session
     * @returns {string} JWT token
     */
    static generateToken(user, current_role) {
        const payload = {
            id: user.id,
            email: user.email,
            roles: user.roles,
            currentRole: current_role
        };

        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN
        });
    }

    static async getProfile(id) {
        const user = await UserService.getUserById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        delete user.password;

        return user;
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Promise<Object>} Decoded token payload
     * @throws {Error} If token is invalid
     */
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);

            return decoded;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }

    /**
     * Initiate forgot password flow
     * @param {string} email - User's email address
     * @returns {Promise<Object>} Result with email sent confirmation
     * @throws {Error} If user not found
     */
    static async forgotPassword(email) {
        const user = await UserService.getUserByEmail(email);

        if (!user) {
            return;
        }

        const reset_code = generateRandomKey(6);

        await CacheService.set(`password_reset:${reset_code}`, user.id, 3600);

        EmailService.sendForgotPasswordMail(
            user.email,
            `${user.last_name} ${user.first_name}`,
            reset_code
        );
    }

    static async resetPassword({ reset_code, new_password }) {
        const user_id = await CacheService.get(`password_reset:${reset_code}`);

        if (!user_id) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const user = await UserService.getUserById(user_id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const hashed_password = await bcrypt.hash(new_password, 10);

        await UserService.updateUser(user.id, { password: hashed_password });

        await CacheService.del(`password_reset:${reset_code}`);

        EmailService.sendPasswordResetMail(
            user.email,
            `${user.last_name} ${user.first_name}`
        );
    }
}

module.exports = AuthService;
