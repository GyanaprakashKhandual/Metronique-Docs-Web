const User = require("../models/user.model.js");
const Workspace = require("../models/workspace.model.js");
const {
    generateJWT,
    generateRefreshToken,
    hashPassword,
} = require("../configs/passport.config.js");
const {
    sendMagicLinkEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
} = require("../configs/mail.config.js");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const sendMagicLink = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
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

            await user.save();
            console.log(`New user created for magic link authentication: ${email}`);
        }

        const magicLinkToken = crypto.randomBytes(32).toString("hex");
        const magicLinkExpires = Date.now() + 15 * 60 * 1000;

        user.magicLinkToken = crypto
            .createHash("sha256")
            .update(magicLinkToken)
            .digest("hex");
        user.magicLinkExpires = magicLinkExpires;

        await user.save();

        const magicLink = `${process.env.FRONTEND_URL
            }/auth/verify-email?token=${magicLinkToken}&email=${encodeURIComponent(
                email
            )}`;

        try {
            await sendMagicLinkEmail(email, magicLink, user.name);
            console.log(`Magic link sent successfully to: ${email}`);

            res.json({
                success: true,
                message: "Magic link sent to your email. Please check your inbox.",
                data: {
                    email,
                    expiresIn: "15 minutes",
                },
            });
        } catch (emailError) {
            console.error(
                `Failed to send magic link email to ${email}: ${emailError.message}`
            );
            res.status(500).json({
                success: false,
                message: "Failed to send magic link. Please try again.",
            });
        }
    } catch (error) {
        console.error(`Magic link generation error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error sending magic link",
        });
    }
};

const verifyMagicLink = async (req, res) => {
    try {
        const { token, email } = req.body;

        if (!token || !email) {
            return res.status(400).json({
                success: false,
                message: "Token and email are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.magicLinkToken || !user.magicLinkExpires) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired magic link",
            });
        }

        if (Date.now() > user.magicLinkExpires) {
            console.log(`Expired magic link token attempt for: ${email}`);
            return res.status(400).json({
                success: false,
                message: "Magic link has expired",
            });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        if (hashedToken !== user.magicLinkToken) {
            console.log(`Invalid magic link token attempt for: ${email}`);
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
            console.log(`Personal workspace created for user: ${email}`);
        }

        await user.save();

        try {
            await sendWelcomeEmail(user.email, user.name);
            console.log(`Welcome email sent to: ${email}`);
        } catch (emailError) {
            console.error(
                `Failed to send welcome email to ${email}: ${emailError.message}`
            );
        }

        const jwtToken = generateJWT(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        console.log(`User successfully verified and logged in: ${email}`);

        res.json({
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
        console.error(`Magic link verification error: ${error.message}`);
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
            console.log("Google OAuth callback failed: No user object");
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

        console.log(`Google OAuth successful for user: ${user.email}`);
        res.redirect(callbackUrl.toString());
    } catch (error) {
        console.error(`Google OAuth callback error: ${error.message}`);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=callback_error`);
    }
};

const githubAuthCallback = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            console.log("GitHub OAuth callback failed: No user object");
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

        console.log(`GitHub OAuth successful for user: ${user.email}`);
        res.redirect(callbackUrl.toString());
    } catch (error) {
        console.error(`GitHub OAuth callback error: ${error.message}`);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=callback_error`);
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.status === "suspended" || user.status === "deleted") {
            console.log(
                `Refresh token rejected for ${user.status} account: ${user.email}`
            );
            return res.status(403).json({
                success: false,
                message: "Account is not active",
            });
        }

        const newToken = generateJWT(user._id);

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
            console.log("Refresh token expired");
            return res.status(401).json({
                success: false,
                message: "Refresh token has expired",
            });
        }

        console.error(`Token refresh error: ${error.message}`);
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
        console.error(`Get current user error: ${error.message}`);
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

        console.log(`Profile updated for user: ${user.email}`);

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: { user },
        });
    } catch (error) {
        console.error(`Profile update error: ${error.message}`);
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

        console.log(`Avatar updated for user: ${user.email}`);

        res.json({
            success: true,
            message: "Avatar updated successfully",
            data: { user },
        });
    } catch (error) {
        console.error(`Avatar update error: ${error.message}`);
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
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
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
            const verificationLink = `${process.env.FRONTEND_URL
                }/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(
                    email
                )}`;
            await sendVerificationEmail(email, verificationLink, name);
            console.log(`Verification email sent to: ${email}`);
        } catch (emailError) {
            console.error(
                `Failed to send verification email to ${email}: ${emailError.message}`
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

        console.log(`New user registered: ${email}`);

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
        console.error(`Registration error: ${error.message}`);
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
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`Login attempt with non-existent email: ${email}`);
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (!user.password) {
            console.log(`Password login attempt for OAuth account: ${email}`);
            return res.status(401).json({
                success: false,
                message: "Please use OAuth login for your account",
            });
        }

        if (user.status === "suspended") {
            console.log(`Login attempt for suspended account: ${email}`);
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended",
            });
        }

        if (user.status === "deleted") {
            console.log(`Login attempt for deleted account: ${email}`);
            return res.status(403).json({
                success: false,
                message: "Your account has been deleted",
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log(`Failed login attempt for: ${email}`);
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

        console.log(`User logged in successfully: ${email}`);

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
        console.error(`Login error: ${error.message}`);
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

        console.log(`User logged out: ${req.user.email}`);

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error(`Logout error: ${error.message}`);
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
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const user = await User.findById(req.user._id);

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "You cannot change password for OAuth accounts",
            });
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            console.log(`Failed password change attempt for: ${user.email}`);
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        user.password = await hashPassword(newPassword);
        user.passwordChangedAt = new Date();

        await user.save();

        console.log(`Password changed successfully for user: ${user.email}`);

        res.json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error(`Password change error: ${error.message}`);
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
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.password) {
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
            console.log(`Password reset link generated for: ${email}`);

            res.json({
                success: true,
                message: "Password reset link sent to your email",
            });
        } catch (emailError) {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            await user.save();

            console.error(
                `Failed to send reset email to ${email}: ${emailError.message}`
            );

            res.status(500).json({
                success: false,
                message: "Error sending reset email",
            });
        }
    } catch (error) {
        console.error(`Forgot password error: ${error.message}`);
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
            return res.status(400).json({
                success: false,
                message: "Token and passwords are required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (password.length < 8) {
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
            console.log("Invalid or expired password reset token attempt");
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

        console.log(`Password reset successful for user: ${user.email}`);

        res.json({
            success: true,
            message: "Password reset successful. Please login with new password.",
        });
    } catch (error) {
        console.error(`Reset password error: ${error.message}`);
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
        console.error(`Get all users error: ${error.message}`);
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
        console.error(`Get user by ID error: ${error.message}`);
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

        console.log(`Account deleted for user: ${req.user.email}`);

        res.json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error(`Account deletion error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error deleting account",
        });
    }
};

module.exports = {
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
