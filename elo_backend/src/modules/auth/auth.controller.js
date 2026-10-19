const AuthService = require('./auth.service');

class AuthController {
    static async signup(req, res) {
        const result = await AuthService.signup(req.body);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    }

    static async login(req, res) {
        const result = await AuthService.login(req.body);

        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }

    static async staffLogin(req, res) {
        const result = await AuthService.staffLogin(req.body);

        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }

    static async verifyEmail(req, res) {
        await AuthService.verifyEmail(req.body.verification_code);

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    }

    static async resendVerification(req, res) {
        const result = await AuthService.resendVerification(req.body.email);

        res.json({
            success: true,
            message: 'Verification email sent successfully',
            data: result
        });
    }

    static async refreshToken(req, res) {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token is required'
            });
        }

        const result = await AuthService.refreshToken(token);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: result
        });
    }

    static async logout(req, res) {
        // In a stateless JWT implementation, logout is handled client-side
        // by removing the token. This endpoint is for completeness.
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }

    static async forgotPassword(req, res) {
        await AuthService.forgotPassword(req.body.email);

        res.json({
            success: true,
            message: 'Password reset link sent successfully'
        });
    }

    static async resetPassword(req, res) {
        await AuthService.resetPassword(req.body);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
}

module.exports = AuthController;
