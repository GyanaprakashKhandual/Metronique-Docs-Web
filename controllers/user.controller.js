const User = require("../models/user.model.js");
const Workspace = require("../models/workspace.model.js");
const {
    sendMagicLinkEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
} = require("../configs/mail.config.js");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
    generateJWT,
    generateRefreshToken,
    hashPassword,
} = require("../utils/auth.util.js");

const verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.body;

        console.log(`[AUTH] Email verification initiated for: ${email}`);

        if (!token || !email) {
            console.log(`[AUTH] Email verification failed: Missing required fields`);
            return res.status(400).json({
                success: false,
                message: "Token and email are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`[AUTH] Email verification failed: User not found - ${email}`);
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.emailVerificationToken || !user.emailVerificationExpires) {
            console.log(`[AUTH] Email verification failed: No verification data - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification link",
            });
        }

        if (Date.now() > user.emailVerificationExpires) {
            console.log(`[AUTH] Email verification failed: Token expired - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Verification link has expired",
            });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        if (hashedToken !== user.emailVerificationToken) {
            console.log(`[AUTH] Email verification failed: Invalid token - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Invalid verification link",
            });
        }

        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        user.lastLoginAt = new Date();
        user.isOnline = true;

        if (!user.workspaces || user.workspaces.length === 0) {
            console.log(`[AUTH] Creating workspace for user: ${email}`);
            const workspace = new Workspace({
                name: `${user.name}'s Workspace`,
                slug: `workspace-${user._id.toString().substring(0, 8)}`,
                description: "Your personal workspace",
                owner: user._id,
                type: "personal",
                members: [
                    {
                        user: user._id,
                        role: "owner",
                        status: "active",
                    },
                ],
                usage: {
                    documents: { count: 0, unlimited: false },
                    storage: { used: 0, unit: 'GB', unlimited: false },
                    members: { count: 1, unlimited: false }
                },
                statistics: {
                    totalDocuments: 0,
                    totalFolders: 0,
                    totalComments: 0,
                    totalActivities: 0,
                    activeMembers: 1,
                    storageUsed: 0,
                    lastActivityAt: new Date()
                }
            });

            await workspace.save();

            user.workspaces = [
                {
                    workspace: workspace._id,
                    role: "owner",
                    joinedAt: new Date(),
                    isPrimary: true,
                },
            ];
            user.primaryWorkspace = workspace._id;
        }

        await user.save();

        sendWelcomeEmail(user.email, user.name)
            .then(() => console.log(`[AUTH] Welcome email sent: ${user.email}`))
            .catch(err => console.error(`[AUTH] Welcome email failed: ${user.email} - ${err.message}`));

        const jwtToken = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        console.log(`[AUTH] Email verification successful: ${email}`);

        return res.json({
            success: true,
            message: "Email verified successfully. You are now logged in.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    primaryWorkspace: user.primaryWorkspace,
                    workspaces: user.workspaces.map((w) => ({
                        workspace: w.workspace,
                        role: w.role,
                        isPrimary: w.isPrimary,
                    })),
                },
                token: jwtToken,
                refreshToken,
                expiresIn: "30d",
            },
        });
    } catch (error) {
        console.error(`[AUTH] Email verification error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error verifying email",
        });
    }
};

const sendMagicLink = async (req, res) => {
    try {
        const { email } = req.body;

        console.log(`[AUTH] Magic link requested for: ${email}`);

        if (!email) {
            console.log(`[AUTH] Magic link failed: Email missing`);
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log(`[AUTH] Magic link failed: Invalid email format - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`[AUTH] Creating new user for magic link: ${email}`);
            user = new User({
                name: email.split("@")[0],
                email: email.toLowerCase(),
                status: "active",
                role: "user",
                isEmailVerified: false,
                preferences: {
                    theme: "auto",
                    fontSize: 16,
                    sendNotificationEmails: true,
                    sendWeeklyDigest: true,
                    sendCollaborationNotifications: true,
                    autoSaveEnabled: true,
                    autoSaveInterval: 5000,
                },
            });
        }

        const magicLinkToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(magicLinkToken)
            .digest("hex");

        const magicLinkExpires = Date.now() + 15 * 60 * 1000;

        user.magicLinkToken = hashedToken;
        user.magicLinkExpires = magicLinkExpires;

        await user.save();

        const magicLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${magicLinkToken}&email=${encodeURIComponent(email)}`;

        try {
            await sendMagicLinkEmail(email, magicLink, user.name);
            console.log(`[AUTH] Magic link sent successfully: ${email}`);

            res.json({
                success: true,
                message: "Magic link sent to your email. Please check your inbox.",
                data: {
                    email,
                    expiresIn: "15 minutes",
                },
            });
        } catch (emailError) {
            console.error(`[AUTH] Magic link email failed: ${email} - ${emailError.message}`);
            res.status(500).json({
                success: false,
                message: "Failed to send magic link. Please try again.",
            });
        }
    } catch (error) {
        console.error(`[AUTH] Magic link error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error sending magic link",
        });
    }
};

const verifyMagicLink = async (req, res) => {
    try {
        const { token, email } = req.body;

        console.log(`[AUTH] Magic link verification initiated for: ${email}`);

        if (!token || !email) {
            console.log(`[AUTH] Magic link verification failed: Missing required fields`);
            return res.status(400).json({
                success: false,
                message: "Token and email are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`[AUTH] Magic link verification failed: User not found - ${email}`);
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.magicLinkToken || !user.magicLinkExpires) {
            console.log(`[AUTH] Magic link verification failed: No magic link data - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Invalid or expired magic link",
            });
        }

        if (Date.now() > user.magicLinkExpires) {
            console.log(`[AUTH] Magic link verification failed: Token expired - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Magic link has expired",
            });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        if (hashedToken !== user.magicLinkToken) {
            console.log(`[AUTH] Magic link verification failed: Invalid token - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Invalid magic link",
            });
        }

        user.magicLinkToken = null;
        user.magicLinkExpires = null;
        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        user.lastLoginAt = new Date();
        user.isOnline = true;

        if (!user.workspaces || user.workspaces.length === 0) {
            console.log(`[AUTH] Creating workspace for user: ${email}`);
            const workspace = new Workspace({
                name: `${user.name}'s Workspace`,
                slug: `workspace-${user._id.toString().substring(0, 8)}`,
                description: "Your personal workspace",
                owner: user._id,
                type: "personal",
                members: [
                    {
                        user: user._id,
                        role: "owner",
                        status: "active",
                    },
                ],
            });

            await workspace.save();

            user.workspaces = [
                {
                    workspace: workspace._id,
                    role: "owner",
                    joinedAt: new Date(),
                    isPrimary: true,
                },
            ];
            user.primaryWorkspace = workspace._id;
        }

        await user.save();

        sendWelcomeEmail(user.email, user.name)
            .then(() => console.log(`[AUTH] Welcome email sent: ${user.email}`))
            .catch(err => console.error(`[AUTH] Welcome email failed: ${user.email} - ${err.message}`));

        const jwtToken = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        console.log(`[AUTH] Magic link verification successful: ${email}`);

        return res.json({
            success: true,
            message: "Email verified successfully. You are now logged in.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    primaryWorkspace: user.primaryWorkspace,
                    workspaces: user.workspaces.map((w) => ({
                        workspace: w.workspace,
                        role: w.role,
                        isPrimary: w.isPrimary,
                    })),
                },
                token: jwtToken,
                refreshToken,
                expiresIn: "30d",
            },
        });
    } catch (error) {
        console.error(`[AUTH] Magic link verification error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error verifying email",
        });
    }
};

const googleAuthCallback = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            console.log(`[AUTH] Google OAuth failed: No user object`);
            return res.redirect(
                `${process.env.FRONTEND_URL}/auth/login?error=auth_failed`
            );
        }

        const token = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        const callbackUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
        callbackUrl.searchParams.append("token", token);
        callbackUrl.searchParams.append("refreshToken", refreshToken);
        callbackUrl.searchParams.append("userId", user._id);
        callbackUrl.searchParams.append("provider", "google");
        callbackUrl.searchParams.append("success", "true");

        console.log(`[AUTH] Google OAuth successful: ${user.email}`);
        res.redirect(callbackUrl.toString());
    } catch (error) {
        console.error(`[AUTH] Google OAuth error: ${error.message}`);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=callback_error`);
    }
};

const githubAuthCallback = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            console.log(`[AUTH] GitHub OAuth failed: No user object`);
            return res.redirect(
                `${process.env.FRONTEND_URL}/auth/login?error=auth_failed`
            );
        }

        const token = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        const callbackUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
        callbackUrl.searchParams.append("token", token);
        callbackUrl.searchParams.append("refreshToken", refreshToken);
        callbackUrl.searchParams.append("userId", user._id);
        callbackUrl.searchParams.append("provider", "github");
        callbackUrl.searchParams.append("success", "true");

        console.log(`[AUTH] GitHub OAuth successful: ${user.email}`);
        res.redirect(callbackUrl.toString());
    } catch (error) {
        console.error(`[AUTH] GitHub OAuth error: ${error.message}`);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=callback_error`);
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            console.log(`[AUTH] Token refresh failed: No token provided`);
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            console.log(`[AUTH] Token refresh failed: User not found`);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.status === "suspended" || user.status === "deleted") {
            console.log(`[AUTH] Token refresh rejected: ${user.status} account - ${user.email}`);
            return res.status(403).json({
                success: false,
                message: "Account is not active",
            });
        }

        const newToken = generateJWT(user._id);

        console.log(`[AUTH] Token refreshed successfully: ${user.email}`);

        res.json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                token: newToken,
                expiresIn: "30d",
            },
        });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            console.log(`[AUTH] Token refresh failed: Token expired`);
            return res.status(401).json({
                success: false,
                message: "Refresh token has expired",
            });
        }

        console.error(`[AUTH] Token refresh error: ${error.message}`);
        res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select(
                "-password -magicLinkToken -magicLinkExpires -emailVerificationToken -passwordResetToken"
            )
            .populate("workspaces.workspace", "name slug logo type")
            .populate("primaryWorkspace", "name slug logo");

        if (!user) {
            console.log(`[AUTH] Get current user failed: User not found`);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        console.error(`[AUTH] Get current user error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error fetching user profile",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const {
            name,
            bio,
            phone,
            jobTitle,
            department,
            location,
            timezone,
            language,
            preferences,
        } = req.body;

        const updateData = {};

        if (name) updateData.name = name.trim();
        if (bio !== undefined) updateData.bio = bio;
        if (phone) updateData.phone = phone;
        if (jobTitle) updateData.jobTitle = jobTitle;
        if (department) updateData.department = department;
        if (location) updateData.location = location;
        if (timezone) updateData.timezone = timezone;
        if (language) updateData.language = language;
        if (preferences) updateData.preferences = preferences;

        const user = await User.findByIdAndUpdate(req.user._id, updateData, {
            new: true,
            runValidators: true,
        }).select("-password -magicLinkToken -magicLinkExpires");

        console.log(`[AUTH] Profile updated: ${user.email}`);

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: { user },
        });
    } catch (error) {
        console.error(`[AUTH] Profile update error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
        });
    }
};

const updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            console.log(`[AUTH] Avatar update failed: No avatar URL provided`);
            return res.status(400).json({
                success: false,
                message: "Avatar URL is required",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar },
            { new: true, runValidators: true }
        ).select("-password");

        console.log(`[AUTH] Avatar updated: ${user.email}`);

        res.json({
            success: true,
            message: "Avatar updated successfully",
            data: { user },
        });
    } catch (error) {
        console.error(`[AUTH] Avatar update error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error updating avatar",
        });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            console.log(`[AUTH] Registration failed: Missing required fields`);
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        if (password !== confirmPassword) {
            console.log(`[AUTH] Registration failed: Passwords do not match`);
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (password.length < 8) {
            console.log(`[AUTH] Registration failed: Password too short`);
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log(`[AUTH] Registration failed: Email already exists - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const hashedPassword = await hashPassword(password);

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            status: "active",
            role: "user",
            isEmailVerified: false,
            preferences: {
                theme: "auto",
                fontSize: 16,
                sendNotificationEmails: true,
                sendWeeklyDigest: true,
                sendCollaborationNotifications: true,
                autoSaveEnabled: true,
                autoSaveInterval: 5000,
            },
        });

        await user.save();

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        try {
            const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
            await sendVerificationEmail(email, verificationLink, name);
            console.log(`[AUTH] Verification email sent: ${email}`);
        } catch (emailError) {
            console.error(`[AUTH] Verification email failed: ${email} - ${emailError.message}`);
        }

        const token = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        console.log(`[AUTH] User registered successfully: ${email}`);

        res.status(201).json({
            success: true,
            message:
                "Registration successful. Please check your email to verify your account.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                },
                token,
                refreshToken,
                expiresIn: "30d",
            },
        });
    } catch (error) {
        console.error(`[AUTH] Registration error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error during registration",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log(`[AUTH] Login failed: Missing credentials`);
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`[AUTH] Login failed: User not found - ${email}`);
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (!user.password) {
            console.log(`[AUTH] Login failed: OAuth account - ${email}`);
            return res.status(401).json({
                success: false,
                message: "Please use OAuth login for your account",
            });
        }

        if (user.status === "suspended") {
            console.log(`[AUTH] Login failed: Suspended account - ${email}`);
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended",
            });
        }

        if (user.status === "deleted") {
            console.log(`[AUTH] Login failed: Deleted account - ${email}`);
            return res.status(403).json({
                success: false,
                message: "Your account has been deleted",
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log(`[AUTH] Login failed: Incorrect password - ${email}`);
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        user.lastLoginAt = new Date();
        user.isOnline = true;
        await user.save();

        const token = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        console.log(`[AUTH] Login successful: ${email}`);

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    primaryWorkspace: user.primaryWorkspace,
                    workspaces: user.workspaces,
                },
                token,
                refreshToken,
                expiresIn: "30d",
            },
        });
    } catch (error) {
        console.error(`[AUTH] Login error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error during login",
        });
    }
};

const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { isOnline: false });

        res.clearCookie("token");
        res.clearCookie("refreshToken");

        console.log(`[AUTH] User logged out: ${req.user.email}`);

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error(`[AUTH] Logout error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error during logout",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            console.log(`[AUTH] Password change failed: Missing fields`);
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            console.log(`[AUTH] Password change failed: Passwords do not match`);
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (newPassword.length < 8) {
            console.log(`[AUTH] Password change failed: Password too short`);
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const user = await User.findById(req.user._id);

        if (!user.password) {
            console.log(`[AUTH] Password change failed: OAuth account - ${user.email}`);
            return res.status(400).json({
                success: false,
                message: "You cannot change password for OAuth accounts",
            });
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            console.log(`[AUTH] Password change failed: Incorrect current password - ${user.email}`);
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        user.password = await hashPassword(newPassword);
        user.passwordChangedAt = new Date();

        await user.save();

        console.log(`[AUTH] Password changed successfully: ${user.email}`);

        res.json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error(`[AUTH] Password change error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error changing password",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            console.log(`[AUTH] Forgot password failed: Email missing`);
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`[AUTH] Forgot password failed: User not found - ${email}`);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.password) {
            console.log(`[AUTH] Forgot password failed: OAuth account - ${email}`);
            return res.status(400).json({
                success: false,
                message: "Password reset not available for OAuth accounts",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000;

        await user.save();

        try {
            const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

            await sendPasswordResetEmail(email, resetLink, user.name);

            console.log(`[AUTH] Password reset link sent: ${email}`);

            res.json({
                success: true,
                message: "Password reset link sent to your email",
            });
        } catch (emailError) {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            await user.save();

            console.error(`[AUTH] Password reset email failed: ${email} - ${emailError.message}`);

            res.status(500).json({
                success: false,
                message: "Error sending reset email",
            });
        }
    } catch (error) {
        console.error(`[AUTH] Forgot password error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error processing forgot password",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            console.log(`[AUTH] Reset password failed: Missing fields`);
            return res.status(400).json({
                success: false,
                message: "Token and passwords are required",
            });
        }

        if (password !== confirmPassword) {
            console.log(`[AUTH] Reset password failed: Passwords do not match`);
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (password.length < 8) {
            console.log(`[AUTH] Reset password failed: Password too short`);
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            console.log(`[AUTH] Reset password failed: Invalid or expired token`);
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        user.password = await hashPassword(password);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordChangedAt = new Date();

        await user.save();

        console.log(`[AUTH] Password reset successful: ${user.email}`);

        res.json({
            success: true,
            message: "Password reset successful. Please login with new password.",
        });
    } catch (error) {
        console.error(`[AUTH] Reset password error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error resetting password",
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        if (status) {
            query.status = status;
        }

        const users = await User.find(query)
            .select("-password -magicLinkToken -magicLinkExpires -passwordResetToken")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        console.log(`[AUTH] Users fetched: ${users.length} of ${total}`);

        res.json({
            success: true,
            data: {
                users,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total,
            },
        });
    } catch (error) {
        console.error(`[AUTH] Get all users error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error fetching users",
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -magicLinkToken -magicLinkExpires -passwordResetToken")
            .populate("workspaces.workspace", "name slug logo type")
            .populate("primaryWorkspace", "name slug logo");

        if (!user) {
            console.log(`[AUTH] Get user by ID failed: User not found - ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        console.error(`[AUTH] Get user by ID error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error fetching user",
        });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                status: "deleted",
                deletedAt: new Date(),
                email: `deleted-${Date.now()}-${req.user.email}`,
            },
            { new: true }
        );

        res.clearCookie("token");
        res.clearCookie("refreshToken");

        console.log(`[AUTH] Account deleted: ${req.user.email}`);

        res.json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error(`[AUTH] Account deletion error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error deleting account",
        });
    }
};

module.exports = {
    verifyEmail,
    sendMagicLink,
    verifyMagicLink,
    googleAuthCallback,
    githubAuthCallback,
    refreshTokenController,
    getCurrentUser,
    updateProfile,
    updateAvatar,
    register,
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    getAllUsers,
    getUserById,
    deleteAccount,
};