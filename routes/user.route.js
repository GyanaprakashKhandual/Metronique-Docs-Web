const express = require('express');
const passport = require('passport');
const { protect, authorize } = require('../middlewares/auth.middleware.js');
const userController = require('../controllers/user.controller.js');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/auth/verify-email-address', userController.verifyEmail);

/**
 * @route   POST /api/users/register
 * @desc    Register user with email and password
 * @access  Public
 */
router.post('/register', userController.register);

/**
 * @route   POST /api/users/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', userController.login);

// ==================== EMAIL AUTHENTICATION (PASSWORDLESS) ====================

/**
 * @route   POST /api/users/auth/email
 * @desc    Send magic link to user email
 * @access  Public
 */
router.post('/auth/email', userController.sendMagicLink);

/**
 * @route   POST /api/users/auth/verify-email
 * @desc    Verify magic link token and authenticate user
 * @access  Public
 */
router.post('/auth/verify-email', userController.verifyMagicLink);

// ==================== GOOGLE OAUTH ====================

/**
 * @route   GET /api/users/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

/**
 * @route   GET /api/users/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=auth_failed`
    }),
    userController.googleAuthCallback
);

// ==================== GITHUB OAUTH ====================

/**
 * @route   GET /api/users/auth/github
 * @desc    Initiate GitHub OAuth login
 * @access  Public
 */
router.get(
    '/auth/github',
    passport.authenticate('github', {
        scope: ['user:email', 'read:user'],
        session: false
    })
);

/**
 * @route   GET /api/users/auth/github/callback
 * @desc    Handle GitHub OAuth callback
 * @access  Public
 */
router.get(
    '/auth/github/callback',
    passport.authenticate('github', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=auth_failed`
    }),
    userController.githubAuthCallback
);

// ==================== TOKEN MANAGEMENT ====================

/**
 * @route   POST /api/users/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', userController.refreshTokenController);

// ==================== PRIVATE ROUTES - REQUIRE AUTHENTICATION ====================

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, userController.getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.put('/me', protect, userController.updateProfile);

/**
 * @route   PUT /api/users/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put('/avatar', protect, userController.updateAvatar);

/**
 * @route   POST /api/users/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, userController.logout);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/me', protect, userController.deleteAccount);

// ==================== PASSWORD MANAGEMENT ====================

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', protect, userController.changePassword);

/**
 * @route   POST /api/users/forgot-password
 * @desc    Send password reset link to email
 * @access  Public
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * @route   POST /api/users/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', userController.resetPassword);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/users
 * @desc    Get all users (paginated)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', protect, userController.getUserById);

module.exports = router;