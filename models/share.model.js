const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    email: String,
    ipAddress: String,
    userAgent: String,
    action: {
        type: String,
        enum: ['view', 'edit', 'comment', 'download', 'copy', 'print', 'share'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    duration: Number,
    device: {
        type: String,
        browser: String,
        os: String
    },
    location: {
        country: String,
        city: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    }
}, { _id: false });

const invitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['viewer', 'commenter', 'editor'],
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending'
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: Date,
    acceptedAt: Date,
    message: String
}, { _id: false });

const documentShareSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    shareType: {
        type: String,
        enum: ['link', 'email', 'domain', 'public'],
        required: true
    },
    shareToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    shortUrl: String,
    role: {
        type: String,
        enum: ['viewer', 'commenter', 'editor'],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    allowedEmails: [{
        type: String,
        lowercase: true
    }],
    allowedDomains: [String],
    blockedEmails: [{
        type: String,
        lowercase: true
    }],
    blockedIPs: [String],
    requireSignIn: {
        type: Boolean,
        default: false
    },
    requirePassword: {
        type: Boolean,
        default: false
    },
    password: String,
    expiresAt: Date,
    maxViews: Number,
    currentViews: {
        type: Number,
        default: 0
    },
    maxDownloads: Number,
    currentDownloads: {
        type: Number,
        default: 0
    },
    permissions: {
        canView: {
            type: Boolean,
            default: true
        },
        canComment: {
            type: Boolean,
            default: true
        },
        canEdit: {
            type: Boolean,
            default: false
        },
        canDownload: {
            type: Boolean,
            default: true
        },
        canCopy: {
            type: Boolean,
            default: true
        },
        canPrint: {
            type: Boolean,
            default: true
        },
        canShare: {
            type: Boolean,
            default: false
        },
        canInvite: {
            type: Boolean,
            default: false
        },
        canDelete: {
            type: Boolean,
            default: false
        },
        canViewHistory: {
            type: Boolean,
            default: true
        }
    },
    restrictions: {
        allowedCountries: [String],
        blockedCountries: [String],
        allowedTimeStart: String,
        allowedTimeEnd: String,
        allowedDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }],
        ipWhitelist: [String],
        requireVerification: Boolean,
        requireApproval: Boolean
    },
    watermark: {
        enabled: Boolean,
        text: String,
        position: {
            type: String,
            enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']
        },
        opacity: Number
    },
    notifications: {
        notifyOnView: Boolean,
        notifyOnEdit: Boolean,
        notifyOnComment: Boolean,
        notifyOnDownload: Boolean,
        emailRecipients: [String]
    },
    invitations: [invitationSchema],
    accessLogs: [accessLogSchema],
    lastAccessedAt: Date,
    lastAccessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    analytics: {
        totalViews: {
            type: Number,
            default: 0
        },
        totalEdits: {
            type: Number,
            default: 0
        },
        totalComments: {
            type: Number,
            default: 0
        },
        totalDownloads: {
            type: Number,
            default: 0
        },
        uniqueViewers: {
            type: Number,
            default: 0
        },
        averageViewDuration: Number
    },
    metadata: {
        userAgent: String,
        referer: String,
        source: String,
        campaign: String
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    revokedAt: Date,
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    revokeReason: String,
    // NEW: Workspace Reference
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },

    // NEW: Activity Reference
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },

    // NEW: Share Revocation Activity
    revocationActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },

    // NEW: Folder Share (for folder sharing)
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    }
}, {
    timestamps: true
});

documentShareSchema.index({ document: 1, isActive: 1 });
documentShareSchema.index({ shareToken: 1 });
documentShareSchema.index({ createdBy: 1 });
documentShareSchema.index({ expiresAt: 1 });
documentShareSchema.index({ 'allowedEmails': 1 });
documentShareSchema.index({ 'invitations.email': 1 });
documentShareSchema.index({ 'invitations.token': 1 });

documentShareSchema.pre('save', function (next) {
    if (this.expiresAt && new Date() > this.expiresAt) {
        this.isActive = false;
    }
    if (this.maxViews && this.currentViews >= this.maxViews) {
        this.isActive = false;
    }
    next();
});

module.exports = mongoose.model('DocumentShare', documentShareSchema);