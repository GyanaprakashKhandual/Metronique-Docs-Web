const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: String,

    avatar: {
        type: String,
        default: ''
    },
    bio: String,
    phone: String,
    jobTitle: String,
    department: String,
    location: String,
    timezone: {
        type: String,
        default: 'UTC'
    },
    language: {
        type: String,
        default: 'en'
    },
    country: String,

    role: {
        type: String,
        enum: ['admin', 'user', 'guest', 'moderator'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifiedAt: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    magicLinkToken: String,
    magicLinkExpires: Date,

    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],

    workspaces: [{
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace'
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'guest'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isPrimary: Boolean
    }],
    primaryWorkspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },

    recentDocuments: [{
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        },
        accessedAt: {
            type: Date,
            default: Date.now
        }
    }],

    favoriteDocuments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],

    sessions: [{
        sessionId: String,
        token: String,
        ipAddress: String,
        userAgent: String,
        deviceType: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActivityAt: Date,
        expiresAt: Date
    }],

    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        fontSize: {
            type: Number,
            default: 16
        },
        defaultFontFamily: {
            type: String,
            default: 'Inter'
        },
        sendNotificationEmails: {
            type: Boolean,
            default: true
        },
        sendWeeklyDigest: {
            type: Boolean,
            default: true
        },
        sendCollaborationNotifications: {
            type: Boolean,
            default: true
        },
        autoSaveEnabled: {
            type: Boolean,
            default: true
        },
        autoSaveInterval: {
            type: Number,
            default: 5000
        }
    },

    socialProfiles: {
        twitter: String,
        linkedin: String,
        github: String
    },
    connections: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'connected', 'blocked'],
            default: 'pending'
        },
        connectedAt: Date
    }],

    notifications: {
        mentions: {
            type: Boolean,
            default: true
        },
        comments: {
            type: Boolean,
            default: true
        },
        shares: {
            type: Boolean,
            default: true
        },
        documentUpdates: {
            type: Boolean,
            default: true
        }
    },

    lastActive: {
        type: Date,
        default: Date.now
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastLoginAt: Date,
    lastLoginIP: String,

    status: {
        type: String,
        enum: ['active', 'suspended', 'deactivated', 'deleted'],
        default: 'active'
    },
    suspendedAt: Date,
    suspensionReason: String,
    deletedAt: Date,

    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    plan: {
        type: String,
        enum: ['free', 'starter', 'pro', 'business'],
        default: 'free'
    },

    totalDocumentsCreated: {
        type: Number,
        default: 0
    },
    totalDocumentsOwned: {
        type: Number,
        default: 0
    },
    collaborationsCount: {
        type: Number,
        default: 0
    },

    apiKeys: [{
        name: String,
        key: String,
        secret: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastUsedAt: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    oauthConnections: [{
        provider: String,
        providerId: String,
        email: String,
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }],

    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,

    profileCompletion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    metadata: {
        signupSource: String,
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, {
    timestamps: true
});

userSchema.methods.comparePassword = async function (password) {
    const { comparePassword } = require('../utils/auth.util.js');
    return await comparePassword(password, this.password);
};

module.exports = mongoose.model('User', userSchema);