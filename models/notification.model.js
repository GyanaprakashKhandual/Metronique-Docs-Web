const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'mention',
            'comment',
            'reply',
            'reaction',
            'share',
            'invite',
            'permission_change',
            'document_shared',
            'document_updated',
            'document_deleted',
            'comment_resolved',
            'suggestion_accepted',
            'suggestion_rejected',
            'assigned',
            'due_date',
            'folder_shared',
            'collaborator_added',
            'collaborator_removed',
            'document_moved',
            'version_restored',
            'export_ready',
            'workspace_invite',
            'subscription_update'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: String,
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    share: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentShare'
    },
    actionUrl: String,
    actionText: String,
    metadata: {
        documentTitle: String,
        folderName: String,
        commentText: String,
        mentionText: String,
        oldPermission: String,
        newPermission: String,
        suggestionType: String,
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        dueDate: Date,
        exportFormat: String,
        blockId: String,
        position: {
            start: Number,
            end: Number
        }
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    category: {
        type: String,
        enum: ['collaboration', 'sharing', 'editing', 'system', 'social', 'admin'],
        default: 'collaboration'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    isDismissed: {
        type: Boolean,
        default: false
    },
    dismissedAt: Date,
    isEmailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: Date,
    isPushSent: {
        type: Boolean,
        default: false
    },
    pushSentAt: Date,
    deliveryStatus: {
        email: {
            status: {
                type: String,
                enum: ['pending', 'sent', 'failed', 'bounced', 'delivered'],
                default: 'pending'
            },
            sentAt: Date,
            error: String
        },
        push: {
            status: {
                type: String,
                enum: ['pending', 'sent', 'failed', 'delivered'],
                default: 'pending'
            },
            sentAt: Date,
            error: String
        },
        inApp: {
            status: {
                type: String,
                enum: ['pending', 'delivered', 'read'],
                default: 'pending'
            },
            deliveredAt: Date
        }
    },
    groupKey: String,
    groupCount: {
        type: Number,
        default: 1
    },
    isGrouped: {
        type: Boolean,
        default: false
    },
    expiresAt: Date,
    clickCount: {
        type: Number,
        default: 0
    },
    lastClickedAt: Date,
    device: {
        type: String,
        platform: String,
        browser: String
    },
    preferences: {
        sendEmail: {
            type: Boolean,
            default: true
        },
        sendPush: {
            type: Boolean,
            default: true
        },
        frequency: {
            type: String,
            enum: ['instant', 'hourly', 'daily', 'weekly'],
            default: 'instant'
        }
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    
    // NEW: Activity Reference
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    
    // NEW: Related User (for mentions/shares)
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // NEW: Notification Group
    groupId: String,
    
    // NEW: Action Metadata
    actionLink: String,
    actionType: String,
    
    // NEW: Read Status with Timestamps
    readAt: Date,
    deletedAt: Date
}, {
    timestamps: true
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, isArchived: 1 });
notificationSchema.index({ document: 1 });
notificationSchema.index({ comment: 1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ createdAt: 1 });

notificationSchema.pre('save', function (next) {
    if (!this.expiresAt) {
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        this.expiresAt = new Date(Date.now() + ninetyDays);
    }

    if (this.isModified('isRead') && this.isRead && !this.readAt) {
        this.readAt = new Date();
    }

    if (this.isModified('isArchived') && this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    }

    next();
});

notificationSchema.statics.markAsRead = async function (notificationIds, userId) {
    return await this.updateMany(
        { _id: { $in: notificationIds }, recipient: userId },
        { isRead: true, readAt: new Date() }
    );
};

notificationSchema.statics.markAllAsRead = async function (userId) {
    return await this.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
};

notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({
        recipient: userId,
        isRead: false,
        isArchived: false
    });
};

notificationSchema.statics.cleanupOldNotifications = async function () {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await this.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        isRead: true
    });
};

notificationSchema.methods.markAsClicked = function () {
    this.clickCount += 1;
    this.lastClickedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);