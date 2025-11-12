const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            console.log('Authentication failed: No token provided');
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            console.log(`Authentication failed: User not found for token ID ${decoded.id}`);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (req.user.status === 'suspended') {
            console.log(`Access denied: Suspended account attempted access - ${req.user.email}`);
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended'
            });
        }

        if (req.user.status === 'deleted') {
            console.log(`Access denied: Deleted account attempted access - ${req.user.email}`);
            return res.status(403).json({
                success: false,
                message: 'Your account has been deleted'
            });
        }

        req.user.lastActive = new Date();
        await req.user.save();

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Authentication failed: Token expired');
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            console.log('Authentication failed: Invalid token');
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.error(`Authentication middleware error: ${error.message}`);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            console.log(`Authorization failed: User ${req.user.email} with role '${req.user.role}' attempted to access restricted route`);
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        }

        next();
    } catch (error) {
        next();
    }
};

const checkWorkspaceAccess = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);

        const hasAccess = user.workspaces.some(
            w => w.workspace.toString() === workspaceId && w.workspace
        );

        if (!hasAccess) {
            console.log(`Workspace access denied: User ${user.email} attempted to access workspace ${workspaceId}`);
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this workspace'
            });
        }

        next();
    } catch (error) {
        console.error(`Workspace access check error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error checking workspace access'
        });
    }
};

const verifyEmailMiddleware = (req, res, next) => {
    if (!req.user.isEmailVerified) {
        console.log(`Email verification required: User ${req.user.email} attempted to access protected resource`);
        return res.status(403).json({
            success: false,
            message: 'Please verify your email before accessing this resource'
        });
    }
    next();
};

const check2FA = (req, res, next) => {
    if (req.user.twoFactorEnabled && !req.session?.twoFAVerified) {
        console.log(`2FA verification required: User ${req.user.email} attempted to access protected resource`);
        return res.status(403).json({
            success: false,
            message: 'Please verify your two-factor authentication'
        });
    }
    next();
};

const rateLimitSensitive = (req, res, next) => {
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000;

    if (!req.session) {
        req.session = {};
    }

    const key = `sensitive_${req.user._id}`;
    const now = Date.now();

    if (!req.session[key]) {
        req.session[key] = { count: 0, reset: now + windowMs };
    }

    if (now > req.session[key].reset) {
        req.session[key].count = 0;
        req.session[key].reset = now + windowMs;
    }

    req.session[key].count++;

    if (req.session[key].count > maxAttempts) {
        console.log(`Rate limit exceeded: User ${req.user.email} exceeded ${maxAttempts} attempts for sensitive operation`);
        return res.status(429).json({
            success: false,
            message: 'Too many attempts. Please try again later.'
        });
    }

    next();
};

const auditLog = (action) => {
    return async (req, res, next) => {
        req.auditAction = action;
        console.log(`Audit: User ${req.user?.email || 'unknown'} performed action: ${action}`);
        next();
    };
};

module.exports = {
    protect,
    authorize,
    optionalAuth,
    checkWorkspaceAccess,
    verifyEmailMiddleware,
    check2FA,
    rateLimitSensitive,
    auditLog
};