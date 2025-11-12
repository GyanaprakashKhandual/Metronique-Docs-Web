const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed', 'partial'],
        default: 'pending'
    },
    itemsSynced: {
        type: Number,
        default: 0
    },
    itemsFailed: {
        type: Number,
        default: 0
    },
    error: String,
    errorDetails: mongoose.Schema.Types.Mixed,
    duration: Number
}, { _id: false });

const webhookSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    events: [{
        type: String,
        enum: [
            'document.created',
            'document.updated',
            'document.deleted',
            'document.shared',
            'comment.added',
            'comment.resolved',
            'user.joined',
            'folder.created',
            'version.created',
            'export.completed'
        ]
    }],
    secret: String,
    isActive: {
        type: Boolean,
        default: true
    },
    headers: mongoose.Schema.Types.Mixed,
    retryPolicy: {
        maxRetries: {
            type: Number,
            default: 3
        },
        retryDelay: {
            type: Number,
            default: 1000
        },
        backoffMultiplier: {
            type: Number,
            default: 2
        }
    },
    lastTriggeredAt: Date,
    failureCount: {
        type: Number,
        default: 0
    },
    lastError: String
}, { _id: false });

const rateLimitSchema = new mongoose.Schema({
    requestsPerMinute: Number,
    requestsPerHour: Number,
    requestsPerDay: Number,
    currentMinute: {
        count: { type: Number, default: 0 },
        resetAt: Date
    },
    currentHour: {
        count: { type: Number, default: 0 },
        resetAt: Date
    },
    currentDay: {
        count: { type: Number, default: 0 },
        resetAt: Date
    }
}, { _id: false });

const integrationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    displayName: String,
    description: String,
    provider: {
        type: String,
        enum: [
            'google_drive',
            'dropbox',
            'onedrive',
            'slack',
            'discord',
            'teams',
            'zapier',
            'make',
            'github',
            'gitlab',
            'jira',
            'trello',
            'asana',
            'notion',
            'figma',
            'miro',
            'stripe',
            'paypal',
            'mailchimp',
            'sendgrid',
            'twilio',
            'zoom',
            'calendar',
            'analytics',
            'custom'
        ],
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'storage',
            'communication',
            'productivity',
            'crm',
            'analytics',
            'payment',
            'automation',
            'calendar',
            'video',
            'design',
            'development',
            'marketing',
            'custom'
        ],
        required: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    credentials: {
        apiKey: String,
        apiSecret: String,
        accessToken: String,
        refreshToken: String,
        tokenType: String,
        expiresAt: Date,
        scope: [String],
        clientId: String,
        clientSecret: String,
        webhookSecret: String
    },
    config: {
        autoSync: {
            type: Boolean,
            default: false
        },
        syncInterval: {
            type: Number,
            default: 3600000 // 1 hour in ms
        },
        syncDirection: {
            type: String,
            enum: ['one_way_to_app', 'one_way_from_app', 'two_way'],
            default: 'one_way_to_app'
        },
        defaultFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
        },
        conflictResolution: {
            type: String,
            enum: ['local_wins', 'remote_wins', 'newest_wins', 'manual'],
            default: 'newest_wins'
        },
        filters: {
            fileTypes: [String],
            folderPaths: [String],
            excludePatterns: [String],
            includePatterns: [String]
        },
        mappings: mongoose.Schema.Types.Mixed,
        customSettings: mongoose.Schema.Types.Mixed
    },
    webhooks: [webhookSchema],
    rateLimit: rateLimitSchema,
    permissions: {
        canRead: {
            type: Boolean,
            default: true
        },
        canWrite: {
            type: Boolean,
            default: false
        },
        canDelete: {
            type: Boolean,
            default: false
        },
        canShare: {
            type: Boolean,
            default: false
        },
        scopes: [String]
    },
    status: {
        type: String,
        enum: ['connected', 'disconnected', 'error', 'expired', 'pending'],
        default: 'connected'
    },
    health: {
        lastCheckAt: Date,
        isHealthy: {
            type: Boolean,
            default: true
        },
        errorCount: {
            type: Number,
            default: 0
        },
        lastError: String,
        uptime: Number
    },
    sync: {
        lastSyncAt: Date,
        nextSyncAt: Date,
        isSyncing: {
            type: Boolean,
            default: false
        },
        syncLogs: [syncLogSchema],
        totalSyncs: {
            type: Number,
            default: 0
        },
        successfulSyncs: {
            type: Number,
            default: 0
        },
        failedSyncs: {
            type: Number,
            default: 0
        }
    },
    usage: {
        requestCount: {
            type: Number,
            default: 0
        },
        lastRequestAt: Date,
        dataTransferred: {
            type: Number,
            default: 0 // in bytes
        },
        errorRate: {
            type: Number,
            default: 0
        }
    },
    connectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    connectedAt: {
        type: Date,
        default: Date.now
    },
    disconnectedAt: Date,
    disconnectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    disconnectReason: String,
    lastUsedAt: Date,
    metadata: {
        version: String,
        environment: {
            type: String,
            enum: ['production', 'development', 'staging'],
            default: 'production'
        },
        region: String,
        endpoint: String,
        userAgent: String
    },
    notifications: {
        onSuccess: {
            type: Boolean,
            default: false
        },
        onError: {
            type: Boolean,
            default: true
        },
        onSync: {
            type: Boolean,
            default: false
        },
        emailRecipients: [String],
        slackChannel: String
    },
    features: {
        importDocuments: {
            type: Boolean,
            default: false
        },
        exportDocuments: {
            type: Boolean,
            default: false
        },
        syncComments: {
            type: Boolean,
            default: false
        },
        syncVersions: {
            type: Boolean,
            default: false
        },
        realTimeSync: {
            type: Boolean,
            default: false
        },
        webhookSupport: {
            type: Boolean,
            default: false
        }
    },
    limits: {
        maxFileSize: Number,
        maxRequestsPerDay: Number,
        maxConcurrentSyncs: Number,
        maxWebhooks: Number
    },
     lastActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    
    // NEW: Integration Events
    lastSyncActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }
}, {
    timestamps: true
});

// Indexes
integrationSchema.index({ workspace: 1, provider: 1 });
integrationSchema.index({ workspace: 1, isEnabled: 1 });
integrationSchema.index({ user: 1, provider: 1 });
integrationSchema.index({ status: 1 });
integrationSchema.index({ 'credentials.expiresAt': 1 });
integrationSchema.index({ 'sync.nextSyncAt': 1 });

// Pre-save middleware
integrationSchema.pre('save', function (next) {
    // Check if token is expired
    if (this.credentials.expiresAt && new Date() > this.credentials.expiresAt) {
        this.status = 'expired';
    }

    // Update health status based on error count
    if (this.health.errorCount > 10) {
        this.health.isHealthy = false;
    }

    // Calculate error rate
    if (this.sync.totalSyncs > 0) {
        this.usage.errorRate = (this.sync.failedSyncs / this.sync.totalSyncs) * 100;
    }

    next();
});

// Instance methods
integrationSchema.methods.refreshToken = async function (newAccessToken, newRefreshToken, expiresIn) {
    this.credentials.accessToken = newAccessToken;
    if (newRefreshToken) {
        this.credentials.refreshToken = newRefreshToken;
    }
    this.credentials.expiresAt = new Date(Date.now() + expiresIn * 1000);
    this.status = 'connected';
    return await this.save();
};

integrationSchema.methods.disconnect = async function (userId, reason) {
    this.isEnabled = false;
    this.isActive = false;
    this.status = 'disconnected';
    this.disconnectedAt = new Date();
    this.disconnectedBy = userId;
    this.disconnectReason = reason;
    return await this.save();
};

integrationSchema.methods.logSync = function (status, itemsSynced, itemsFailed, error) {
    const syncLog = {
        startedAt: new Date(),
        completedAt: new Date(),
        status,
        itemsSynced: itemsSynced || 0,
        itemsFailed: itemsFailed || 0,
        error: error ? error.message : null,
        errorDetails: error
    };

    // Keep only last 50 sync logs
    if (this.sync.syncLogs.length >= 50) {
        this.sync.syncLogs.shift();
    }

    this.sync.syncLogs.push(syncLog);
    this.sync.lastSyncAt = new Date();
    this.sync.totalSyncs += 1;

    if (status === 'completed') {
        this.sync.successfulSyncs += 1;
    } else if (status === 'failed') {
        this.sync.failedSyncs += 1;
        this.health.errorCount += 1;
        this.health.lastError = error ? error.message : 'Sync failed';
    }

    return this.save();
};

integrationSchema.methods.checkHealth = async function () {
    this.health.lastCheckAt = new Date();

    // Health is good if error count is low and last sync was successful
    const recentSyncs = this.sync.syncLogs.slice(-5);
    const successRate = recentSyncs.filter(log => log.status === 'completed').length / recentSyncs.length;

    this.health.isHealthy = successRate > 0.7 && this.health.errorCount < 10;

    return await this.save();
};

integrationSchema.methods.incrementUsage = async function () {
    this.usage.requestCount += 1;
    this.usage.lastRequestAt = new Date();
    this.lastUsedAt = new Date();
    return await this.save();
};

integrationSchema.methods.triggerWebhook = async function (event, data) {
    const webhooks = this.webhooks.filter(wh =>
        wh.isActive && wh.events.includes(event)
    );

    const results = [];
    for (const webhook of webhooks) {
        try {
            // This would be implemented in a service layer
            // Just updating metadata here
            webhook.lastTriggeredAt = new Date();
            webhook.failureCount = 0;
            results.push({ webhook: webhook.url, status: 'success' });
        } catch (error) {
            webhook.failureCount += 1;
            webhook.lastError = error.message;
            if (webhook.failureCount >= webhook.retryPolicy.maxRetries) {
                webhook.isActive = false;
            }
            results.push({ webhook: webhook.url, status: 'failed', error: error.message });
        }
    }

    await this.save();
    return results;
};

// Static methods
integrationSchema.statics.findByWorkspace = async function (workspaceId, options = {}) {
    const { isEnabled = true, provider } = options;

    const query = { workspace: workspaceId };
    if (isEnabled !== undefined) query.isEnabled = isEnabled;
    if (provider) query.provider = provider;

    return await this.find(query)
        .populate('user', 'name email avatar')
        .populate('connectedBy', 'name email')
        .sort({ createdAt: -1 });
};

integrationSchema.statics.findActiveIntegrations = async function (workspaceId) {
    return await this.find({
        workspace: workspaceId,
        isEnabled: true,
        isActive: true,
        status: 'connected'
    })
        .populate('user', 'name email avatar');
};

integrationSchema.statics.findExpiredTokens = async function () {
    const now = new Date();
    return await this.find({
        'credentials.expiresAt': { $lt: now },
        status: { $ne: 'expired' }
    });
};

integrationSchema.statics.findPendingSync = async function () {
    const now = new Date();
    return await this.find({
        'config.autoSync': true,
        isEnabled: true,
        isActive: true,
        'sync.isSyncing': false,
        'sync.nextSyncAt': { $lte: now }
    });
};

integrationSchema.statics.getWorkspaceUsage = async function (workspaceId) {
    const integrations = await this.find({ workspace: workspaceId });

    return {
        total: integrations.length,
        active: integrations.filter(i => i.isActive && i.isEnabled).length,
        byProvider: integrations.reduce((acc, i) => {
            acc[i.provider] = (acc[i.provider] || 0) + 1;
            return acc;
        }, {}),
        totalRequests: integrations.reduce((sum, i) => sum + i.usage.requestCount, 0),
        totalSyncs: integrations.reduce((sum, i) => sum + i.sync.totalSyncs, 0)
    };
};

module.exports = mongoose.model('Integration', integrationSchema);