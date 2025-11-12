const mongoose = require('mongoose');

// COMPLETE UPDATED USER MODEL
const userSchema = new mongoose.Schema({
    // Basic Info
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
        trim: true,
        index: true
    },
    password: String,
    
    // NEW: Avatar & Profile
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
    
    // NEW: Account Status
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
    
    // NEW: Authentication & Security
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
    
    // NEW: Workspace Relationships (CRITICAL)
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
    
    // NEW: Recent Documents (for quick access)
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
    
    // NEW: Favorite Documents
    favoriteDocuments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],
    
    // NEW: Sessions (for activity tracking)
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
    
    // NEW: Preferences
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
            default: 5000 // milliseconds
        }
    },
    
    // NEW: Social & Connections
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
    
    // NEW: Notification Preferences
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
    
    // NEW: Activity Tracking
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
    
    // NEW: Status Fields
    status: {
        type: String,
        enum: ['active', 'suspended', 'deactivated', 'deleted'],
        default: 'active'
    },
    suspendedAt: Date,
    suspensionReason: String,
    deletedAt: Date,
    
    // NEW: Subscription & Billing
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    plan: {
        type: String,
        enum: ['free', 'starter', 'pro', 'business'],
        default: 'free'
    },
    
    // NEW: Search & Analytics
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
    
    // NEW: API & Integrations
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
    
    // NEW: OAuth Connections
    oauthConnections: [{
        provider: String,
        providerId: String,
        email: String,
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // NEW: Password Reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    
    // NEW: Profile Completion
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

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'workspaces.workspace': 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);