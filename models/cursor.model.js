const mongoose = require('mongoose');

const selectionSchema = new mongoose.Schema({
    blockId: String,
    startOffset: Number,
    endOffset: Number,
    startBlockIndex: Number,
    endBlockIndex: Number,
    isCollapsed: {
        type: Boolean,
        default: true
    },
    direction: {
        type: String,
        enum: ['forward', 'backward', 'none'],
        default: 'none'
    },
    selectedText: String,
    anchorNode: String,
    focusNode: String
}, { _id: false });

const viewportSchema = new mongoose.Schema({
    scrollTop: Number,
    scrollLeft: Number,
    visibleBlockIds: [String],
    viewportHeight: Number,
    viewportWidth: Number,
    zoom: {
        type: Number,
        default: 1
    }
}, { _id: false });

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['typing', 'selecting', 'scrolling', 'idle', 'editing', 'commenting', 'formatting', 'inserting', 'deleting'],
        required: true
    },
    blockId: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    duration: Number
}, { _id: false });

const cursorSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    socketId: String,
    position: {
        blockId: {
            type: String,
            required: true
        },
        offset: {
            type: Number,
            required: true,
            default: 0
        },
        blockIndex: Number,
        lineNumber: Number,
        columnNumber: Number,
        x: Number,
        y: Number
    },
    selection: selectionSchema,
    viewport: viewportSchema,
    color: {
        type: String,
        default: '#3b82f6'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isTyping: {
        type: Boolean,
        default: false
    },
    currentActivity: activitySchema,
    recentActivities: [activitySchema],
    presence: {
        status: {
            type: String,
            enum: ['active', 'idle', 'away', 'offline'],
            default: 'active'
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        customStatus: String,
        statusEmoji: String
    },
    device: {
        type: {
            type: String,
            enum: ['desktop', 'tablet', 'mobile'],
            default: 'desktop'
        },
        browser: String,
        os: String,
        screenResolution: String
    },
    permissions: {
        canEdit: {
            type: Boolean,
            default: true
        },
        canComment: {
            type: Boolean,
            default: true
        },
        canView: {
            type: Boolean,
            default: true
        }
    },
    followMode: {
        isFollowing: {
            type: Boolean,
            default: false
        },
        followingUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    cursor: {
        shape: {
            type: String,
            enum: ['line', 'block', 'underline'],
            default: 'line'
        },
        blinkRate: Number,
        width: Number
    },
    focusedElement: {
        type: String,
        elementId: String,
        elementType: String
    },
    editingBlock: {
        blockId: String,
        lockedAt: Date,
        lockExpires: Date
    },
    collaborationMode: {
        type: String,
        enum: ['edit', 'suggest', 'view'],
        default: 'edit'
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    },
    connectionQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'excellent'
    },
    latency: Number,
    version: {
        type: Number,
        default: 1
    },
    metadata: {
        language: String,
        timezone: String,
        locale: String
    }
}, {
    timestamps: true
});

cursorSchema.index({ document: 1, user: 1 });
cursorSchema.index({ document: 1, isActive: 1 });
cursorSchema.index({ sessionId: 1 });
cursorSchema.index({ socketId: 1 });
cursorSchema.index({ lastHeartbeat: 1 });
cursorSchema.index({ 'presence.status': 1 });

cursorSchema.pre('save', function (next) {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (this.lastHeartbeat < fiveMinutesAgo) {
        this.isActive = false;
        this.presence.status = 'offline';
    }

    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    if (this.presence.lastActiveAt < oneMinuteAgo && this.presence.status === 'active') {
        this.presence.status = 'idle';
    }

    next();
});

cursorSchema.statics.cleanupInactiveCursors = async function () {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await this.deleteMany({
        lastHeartbeat: { $lt: fiveMinutesAgo },
        isActive: false
    });
};

module.exports = mongoose.model('Cursor', cursorSchema);