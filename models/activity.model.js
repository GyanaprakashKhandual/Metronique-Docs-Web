const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['document', 'folder', 'comment', 'user', 'workspace', 'share', 'version'],
        required: true
    },
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: String,
    title: String
}, { _id: false });

const changeDetailSchema = new mongoose.Schema({
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    path: String,
    blockId: String,
    operation: {
        type: String,
        enum: ['insert', 'delete', 'update', 'move', 'format', 'replace']
    }
}, { _id: false });

const activitySchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    actorName: String,
    actorEmail: String,
    actorAvatar: String,
    action: {
        type: String,
        enum: [
            'created',
            'updated',
            'deleted',
            'renamed',
            'moved',
            'copied',
            'restored',
            'archived',
            'unarchived',
            'trashed',
            'untrashed',
            'starred',
            'unstarred',
            'shared',
            'unshared',
            'permission_changed',
            'viewed',
            'downloaded',
            'exported',
            'printed',
            'commented',
            'replied',
            'mentioned',
            'resolved',
            'reopened',
            'reacted',
            'suggested',
            'accepted_suggestion',
            'rejected_suggestion',
            'formatted',
            'inserted',
            'removed',
            'collaborated',
            'invited',
            'joined',
            'left',
            'locked',
            'unlocked',
            'version_created',
            'version_restored',
            'folder_created',
            'folder_deleted',
            'folder_moved',
            'access_granted',
            'access_revoked',
            'template_created',
            'template_used',
            'integrated',
            'webhook_triggered',
            'bulk_action'
        ],
        required: true,
        index: true
    },
    target: targetSchema,
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        index: true
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        index: true
    },
    description: String,
    changes: [changeDetailSchema],
    metadata: {
        documentTitle: String,
        documentVersion: Number,
        folderName: String,
        folderPath: String,
        commentText: String,
        oldTitle: String,
        newTitle: String,
        oldFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
        },
        newFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
        },
        shareToken: String,
        shareType: String,
        permission: String,
        oldPermission: String,
        newPermission: String,
        collaborator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        collaboratorName: String,
        collaboratorEmail: String,
        blockId: String,
        blockType: String,
        position: {
            start: Number,
            end: Number
        },
        suggestionType: String,
        reaction: String,
        exportFormat: String,
        integrationName: String,
        webhookEvent: String,
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Template'
        },
        templateName: String,
        bulkCount: Number,
        bulkTargets: [String]
    },
    ipAddress: String,
    userAgent: String,
    device: {
        type: {
            type: String,
            enum: ['desktop', 'tablet', 'mobile', 'api', 'webhook']
        },
        browser: String,
        os: String,
        platform: String
    },
    location: {
        country: String,
        city: String,
        region: String,
        timezone: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    sessionId: String,
    apiKey: String,
    source: {
        type: String,
        enum: ['web', 'mobile', 'desktop', 'api', 'integration', 'webhook', 'system'],
        default: 'web'
    },
    category: {
        type: String,
        enum: ['content', 'collaboration', 'sharing', 'organization', 'admin', 'system'],
        default: 'content'
    },
    severity: {
        type: String,
        enum: ['info', 'low', 'medium', 'high', 'critical'],
        default: 'info'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    parentActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    relatedActivities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],
    duration: Number,
    byteSize: Number,
    changeCount: Number,
    affectedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    tags: [String],
    isReverted: {
        type: Boolean,
        default: false
    },
    revertedAt: Date,
    revertedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    revertActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    isAggregated: {
        type: Boolean,
        default: false
    },
    aggregatedCount: {
        type: Number,
        default: 1
    },
    aggregationPeriod: {
        start: Date,
        end: Date
    },
    visibility: {
        type: String,
        enum: ['public', 'collaborators', 'owner', 'system'],
        default: 'collaborators'
    },
    retention: {
        expiresAt: Date,
        isPermanent: {
            type: Boolean,
            default: false
        }
    },
    compliance: {
        isAudited: {
            type: Boolean,
            default: false
        },
        auditLevel: {
            type: String,
            enum: ['none', 'basic', 'detailed', 'full']
        },
        regulations: [String],
        isEncrypted: Boolean
    },
    integration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Integration'
    },
    
    // NEW: Webhook Reference
    webhook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Webhook'
    },
    
    // NEW: Export Reference
    export: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Export'
    }
}, {
    timestamps: true
});

activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ document: 1, createdAt: -1 });
activitySchema.index({ folder: 1, createdAt: -1 });
activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ category: 1 });
activitySchema.index({ 'target.type': 1, 'target.id': 1 });
activitySchema.index({ sessionId: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ 'retention.expiresAt': 1 }, { expireAfterSeconds: 0 });
activitySchema.index({ isSystem: 1, severity: 1 });
activitySchema.index({ affectedUsers: 1 });

activitySchema.pre('save', function (next) {
    if (!this.retention.isPermanent && !this.retention.expiresAt) {
        let retentionDays = 90;

        if (this.severity === 'critical' || this.compliance.isAudited) {
            retentionDays = 365;
        } else if (this.severity === 'high') {
            retentionDays = 180;
        }

        this.retention.expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    }

    if (this.changes && this.changes.length > 0) {
        this.changeCount = this.changes.length;
    }

    next();
});

activitySchema.statics.getDocumentTimeline = async function (documentId, options = {}) {
    const { limit = 50, skip = 0, actorId, action, startDate, endDate } = options;

    const query = { document: documentId };

    if (actorId) query.actor = actorId;
    if (action) query.action = action;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('actor', 'name email avatar')
        .populate('metadata.collaborator', 'name email');
};

activitySchema.statics.getUserActivity = async function (userId, options = {}) {
    const { limit = 50, skip = 0, category, startDate, endDate } = options;

    const query = { actor: userId };

    if (category) query.category = category;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('document', 'title')
        .populate('folder', 'name');
};

activitySchema.statics.getWorkspaceActivity = async function (workspaceId, options = {}) {
    const { limit = 100, skip = 0, severity, category } = options;

    const query = { workspace: workspaceId };

    if (severity) query.severity = severity;
    if (category) query.category = category;

    return await this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('actor', 'name email avatar')
        .populate('document', 'title');
};

activitySchema.statics.getAuditLog = async function (options = {}) {
    const {
        documentId,
        userId,
        workspaceId,
        actions,
        severity,
        startDate,
        endDate,
        limit = 100,
        skip = 0
    } = options;

    const query = { 'compliance.isAudited': true };

    if (documentId) query.document = documentId;
    if (userId) query.actor = userId;
    if (workspaceId) query.workspace = workspaceId;
    if (actions) query.action = { $in: actions };
    if (severity) query.severity = severity;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('actor', 'name email')
        .populate('document', 'title')
        .populate('workspace', 'name');
};

activitySchema.statics.aggregateByPeriod = async function (documentId, period = 'day') {
    const groupBy = {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        week: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    };

    return await this.aggregate([
        { $match: { document: mongoose.Types.ObjectId(documentId) } },
        {
            $group: {
                _id: {
                    period: groupBy[period],
                    action: '$action'
                },
                count: { $sum: 1 },
                actors: { $addToSet: '$actor' }
            }
        },
        { $sort: { '_id.period': -1 } }
    ]);
};

activitySchema.methods.revert = async function (revertedBy) {
    this.isReverted = true;
    this.revertedAt = new Date();
    this.revertedBy = revertedBy;

    const revertActivity = new this.constructor({
        actor: revertedBy,
        action: 'restored',
        target: this.target,
        document: this.document,
        folder: this.folder,
        workspace: this.workspace,
        description: `Reverted activity: ${this.action}`,
        parentActivity: this._id,
        category: this.category,
        source: 'system',
        isSystem: true
    });

    await revertActivity.save();
    this.revertActivity = revertActivity._id;

    return await this.save();
};

const activitySchema = mongoose.model('Activity', activitySchema);
module.exports = activitySchema;