const express = require('express');
const AuthController = require('./auth.controller');
const { signup_schema } = require('./dto/signup.dto');
const { login_schema } = require('./dto/login.dto');
const { resend_verification_schema } = require('./dto/resend-verification.dto');
const { forgot_password_schema } = require('./dto/forgot-password.dto');
const Validator = require('../../shared/middleware/validation');
const { verify_email_schema } = require('./dto/verify-email.dto');
const { reset_password_schema } = require('./dto/reset-password.dto');
const { staff_login_schema } = require('../analysis/dto/analysis.dto');
const AuthMiddleware = require('../../shared/middleware/auth');

const router = express.Router();

router.post('/signup', Validator.middleware({ body: signup_schema }), AuthController.signup);

router.post('/login', Validator.middleware({ body: login_schema }), AuthController.login);

router.post('/staff-login', Validator.middleware({ body: staff_login_schema }), AuthController.staffLogin);

router.post('/verify-email', Validator.middleware({ body: verify_email_schema }), AuthController.verifyEmail);

router.post('/resend-verification', Validator.middleware({ body: resend_verification_schema }), AuthController.resendVerification);

router.post('/logout', AuthMiddleware.authenticate, AuthController.logout);

router.post('/forgot-password', Validator.middleware({ body: forgot_password_schema }), AuthController.forgotPassword);

router.post('/reset-password', Validator.middleware({ body: reset_password_schema }), AuthController.resetPassword);

module.exports = router;
