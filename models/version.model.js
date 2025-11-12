const mongoose = require('mongoose');

const changeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['insert', 'delete', 'update', 'format', 'move', 'replace'],
        required: true
    },
    blockId: String,
    path: String,
    position: Number,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    length: Number,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const documentVersionSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    title: String,
    content: {
        blocks: [mongoose.Schema.Types.Mixed]
    },
    snapshot: {
        type: Boolean,
        default: false
    },
    changes: [changeSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: String,
    label: String,
    isNamed: {
        type: Boolean,
        default: false
    },
    isMajor: {
        type: Boolean,
        default: false
    },
    tags: [String],
    diffSize: {
        type: Number,
        default: 0
    },
    wordCountDiff: Number,
    sessionId: String,
    device: {
        type: String,
        userAgent: String,
        platform: String,
        browser: String
    },
    changesSummary: {
        insertions: {
            type: Number,
            default: 0
        },
        deletions: {
            type: Number,
            default: 0
        },
        modifications: {
            type: Number,
            default: 0
        }
    },
    metadata: {
        pageSettings: mongoose.Schema.Types.Mixed,
        defaultFont: mongoose.Schema.Types.Mixed,
        coverImage: String,
        icon: String
    },
    parentVersion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentVersion'
    },
    restoredFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentVersion'
    },
    isRestorePoint: {
        type: Boolean,
        default: false
    },
    expiresAt: Date,
    size: Number,
     // NEW: Workspace Reference
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    
    // NEW: Collaboration Info
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        contributedAt: Date
    }],
    
    // NEW: Branch Info (for variant tracking)
    branch: String,
    branchParent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentVersion'
    }
}, {
    timestamps: true
});

documentVersionSchema.index({ document: 1, versionNumber: -1 });
documentVersionSchema.index({ document: 1, createdAt: -1 });
documentVersionSchema.index({ document: 1, snapshot: 1 });
documentVersionSchema.index({ document: 1, isNamed: 1 });
documentVersionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

documentVersionSchema.pre('save', function (next) {
    if (!this.expiresAt && !this.snapshot && !this.isNamed) {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        this.expiresAt = new Date(Date.now() + thirtyDays);
    }
    next();
});

module.exports = mongoose.model('DocumentVersion', documentVersionSchema);