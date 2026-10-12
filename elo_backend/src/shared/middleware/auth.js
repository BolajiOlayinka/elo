const AuthService = require('../../modules/auth/auth.service');
const { UnauthorizedException, ForbiddenException } = require('../exceptions');

class AuthMiddleware {
    static authenticate(req, res, next) {
        const auth_header = req.headers.authorization;
        if (!auth_header || !auth_header.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = auth_header.split(' ')[1];
        const decoded = AuthService.verifyToken(token);

        req.user = decoded;
        next();
    }

    static restrictTo(...allowed_roles) {
        return (req, res, next) => {
            if (!req.user || !req.user.roles) {
                return next(new UnauthorizedException('User not authenticated'));
            }

            const user_roles = req.user.roles;

            const has_permission = user_roles.some(role => allowed_roles.includes(role));

            if (!has_permission) {
                return next(new ForbiddenException('You do not have permission to perform this action'));
            }

            next();
        };
    }
}

module.exports = AuthMiddleware;
