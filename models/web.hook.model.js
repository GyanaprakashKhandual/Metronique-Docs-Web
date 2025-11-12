const mongoose = require('mongoose');
const crypto = require('crypto');

const deliveryAttemptSchema = new mongoose.Schema({
    attemptNumber: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'timeout'],
        required: true
    },
    statusCode: Number,
    responseTime: Number, // in milliseconds
    requestHeaders: mongoose.Schema.Types.Mixed,
    requestBody: mongoose.Schema.Types.Mixed,
    responseHeaders: mongoose.Schema.Types.Mixed,
    responseBody: String,
    error: String,
    errorCode: String
}, { _id: false });

const eventLogSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true
    },
    eventId: {
        type: String,
        required: true
    },
    triggeredAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'failed', 'cancelled'],
        default: 'pending'
    },
    deliveryAttempts: [deliveryAttemptSchema],
    totalAttempts: {
        type: Number,
        default: 0
    },
    lastAttemptAt: Date,
    deliveredAt: Date,
    payload: mongoose.Schema.Types.Mixed,
    payloadSize: Number, // in bytes
    responseTime: Number,
    nextRetryAt: Date
}, { _id: false });

const webhookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    url: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'URL must be a valid HTTP or HTTPS URL'
        }
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    events: [{
        type: String,
        enum: [
            // Document events
            'document.created',
            'document.updated',
            'document.deleted',
            'document.renamed',
            'document.moved',
            'document.shared',
            'document.unshared',
            'document.archived',
            'document.restored',
            'document.exported',
            'document.viewed',
            // Comment events
            'comment.created',
            'comment.updated',
            'comment.deleted',
            'comment.resolved',
            'comment.reopened',
            'comment.mentioned',
            // Collaboration events
            'user.mentioned',
            'collaborator.added',
            'collaborator.removed',
            'permission.changed',
            // Folder events
            'folder.created',
            'folder.updated',
            'folder.deleted',
            'folder.moved',
            // Version events
            'version.created',
            'version.restored',
            // Workspace events
            'workspace.member_joined',
            'workspace.member_left',
            'workspace.member_invited',
            // Share events
            'share.created',
            'share.accessed',
            'share.revoked',
            // Template events
            'template.created',
            'template.used',
            // Export events
            'export.completed',
            'export.failed',
            // System events
            'system.error',
            'system.warning'
        ],
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    secret: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ['POST', 'PUT', 'PATCH'],
        default: 'POST'
    },
    headers: {
        type: Map,
        of: String,
        default: new Map()
    },
    contentType: {
        type: String,
        enum: ['application/json', 'application/x-www-form-urlencoded'],
        default: 'application/json'
    },
    timeout: {
        type: Number,
        default: 30000, // 30 seconds
        min: 1000,
        max: 60000
    },
    retryPolicy: {
        enabled: {
            type: Boolean,
            default: true
        },
        maxAttempts: {
            type: Number,
            default: 3,
            min: 1,
            max: 10
        },
        retryDelay: {
            type: Number,
            default: 1000, // 1 second
            min: 100
        },
        backoffMultiplier: {
            type: Number,
            default: 2,
            min: 1
        },
        retryOn: [{
            type: String,
            enum: ['timeout', 'network_error', '5xx', '429']
        }]
    },
    filters: {
        documentIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        }],
        folderIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
        }],
        userIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        tags: [String],
        conditions: mongoose.Schema.Types.Mixed
    },
    transform: {
        enabled: {
            type: Boolean,
            default: false
        },
        template: String, // JSONata expression
        includeMetadata: {
            type: Boolean,
            default: true
        },
        excludeFields: [String],
        customFields: mongoose.Schema.Types.Mixed
    },
    rateLimit: {
        enabled: {
            type: Boolean,
            default: false
        },
        maxRequests: Number,
        perSeconds: Number,
        currentCount: {
            type: Number,
            default: 0
        },
        resetAt: Date
    },
    security: {
        verifySSL: {
            type: Boolean,
            default: true
        },
        allowedIPs: [String],
        requireAuth: {
            type: Boolean,
            default: false
        },
        authType: {
            type: String,
            enum: ['none', 'basic', 'bearer', 'api_key', 'oauth2']
        },
        authCredentials: mongoose.Schema.Types.Mixed
    },
    statistics: {
        totalEvents: {
            type: Number,
            default: 0
        },
        successfulDeliveries: {
            type: Number,
            default: 0
        },
        failedDeliveries: {
            type: Number,
            default: 0
        },
        lastTriggeredAt: Date,
        lastSuccessAt: Date,
        lastFailureAt: Date,
        averageResponseTime: Number,
        successRate: {
            type: Number,
            default: 100
        },
        totalPayloadSize: {
            type: Number,
            default: 0
        }
    },
    status: {
        health: {
            type: String,
            enum: ['healthy', 'degraded', 'failing', 'disabled'],
            default: 'healthy'
        },
        lastHealthCheck: Date,
        consecutiveFailures: {
            type: Number,
            default: 0
        },
        disabledReason: String,
        disabledAt: Date,
        autoDisableThreshold: {
            type: Number,
            default: 10
        }
    },
    eventLogs: [eventLogSchema],
    notifications: {
        onFailure: {
            type: Boolean,
            default: true
        },
        onDisabled: {
            type: Boolean,
            default: true
        },
        emails: [String],
        slackWebhook: String
    },
    metadata: {
        version: {
            type: String,
            default: '1.0'
        },
        environment: {
            type: String,
            enum: ['production', 'staging', 'development'],
            default: 'production'
        },
        tags: [String],
        notes: String
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    integration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Integration'
    },
    
    // NEW: Webhook Activity Tracking
    lastTriggerActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }
}, {
    timestamps: true
});

// Indexes
webhookSchema.index({ workspace: 1, isActive: 1 });
webhookSchema.index({ workspace: 1, events: 1 });
webhookSchema.index({ createdBy: 1 });
webhookSchema.index({ 'status.health': 1 });
webhookSchema.index({ 'statistics.lastTriggeredAt': -1 });
webhookSchema.index({ isActive: 1, 'status.health': 1 });

// Virtual for recent logs
webhookSchema.virtual('recentLogs').get(function () {
    return this.eventLogs.slice(-20); // Last 20 logs
});

// Pre-save middleware
webhookSchema.pre('save', function (next) {
    // Generate secret if not set
    if (!this.secret) {
        this.secret = crypto.randomBytes(32).toString('hex');
    }

    // Calculate success rate
    const total = this.statistics.successfulDeliveries + this.statistics.failedDeliveries;
    if (total > 0) {
        this.statistics.successRate = (this.statistics.successfulDeliveries / total) * 100;
    }

    // Auto-disable on consecutive failures
    if (this.status.consecutiveFailures >= this.status.autoDisableThreshold) {
        this.isActive = false;
        this.status.health = 'disabled';
        this.status.disabledAt = new Date();
        this.status.disabledReason = 'Auto-disabled due to consecutive failures';
    }

    // Update health status based on recent performance
    if (this.statistics.successRate < 50) {
        this.status.health = 'failing';
    } else if (this.statistics.successRate < 80) {
        this.status.health = 'degraded';
    } else if (this.isActive) {
        this.status.health = 'healthy';
    }

    // Keep only last 100 event logs to prevent document from growing too large
    if (this.eventLogs.length > 100) {
        this.eventLogs = this.eventLogs.slice(-100);
    }

    next();
});

// Instance methods
webhookSchema.methods.trigger = async function (eventType, payload) {
    // Check if webhook handles this event type
    if (!this.events.includes(eventType)) {
        return { success: false, reason: 'Event type not subscribed' };
    }

    // Check if webhook is active
    if (!this.isActive) {
        return { success: false, reason: 'Webhook is not active' };
    }

    // Check rate limit
    if (this.rateLimit.enabled) {
        const now = new Date();
        if (this.rateLimit.resetAt && now < this.rateLimit.resetAt) {
            if (this.rateLimit.currentCount >= this.rateLimit.maxRequests) {
                return { success: false, reason: 'Rate limit exceeded' };
            }
        } else {
            this.rateLimit.currentCount = 0;
            this.rateLimit.resetAt = new Date(now.getTime() + this.rateLimit.perSeconds * 1000);
        }
        this.rateLimit.currentCount += 1;
    }

    // Apply filters
    if (this.filters.documentIds && this.filters.documentIds.length > 0) {
        if (!this.filters.documentIds.includes(payload.documentId)) {
            return { success: false, reason: 'Document not in filter' };
        }
    }

    // Create event log
    const eventId = crypto.randomBytes(16).toString('hex');
    const eventLog = {
        eventType,
        eventId,
        triggeredAt: new Date(),
        status: 'pending',
        deliveryAttempts: [],
        totalAttempts: 0,
        payload: this.transform.enabled ? this.transformPayload(payload) : payload,
        payloadSize: JSON.stringify(payload).length
    };

    this.eventLogs.push(eventLog);
    this.statistics.totalEvents += 1;
    this.statistics.lastTriggeredAt = new Date();
    this.statistics.totalPayloadSize += eventLog.payloadSize;

    await this.save();

    return { success: true, eventId, eventLog };
};

webhookSchema.methods.recordDeliveryAttempt = async function (eventId, attempt) {
    const eventLog = this.eventLogs.find(log => log.eventId === eventId);

    if (!eventLog) {
        throw new Error('Event log not found');
    }

    eventLog.deliveryAttempts.push(attempt);
    eventLog.totalAttempts += 1;
    eventLog.lastAttemptAt = new Date();

    if (attempt.status === 'success') {
        eventLog.status = 'delivered';
        eventLog.deliveredAt = new Date();
        eventLog.responseTime = attempt.responseTime;

        this.statistics.successfulDeliveries += 1;
        this.statistics.lastSuccessAt = new Date();
        this.status.consecutiveFailures = 0;

        // Update average response time
        const total = this.statistics.successfulDeliveries;
        const current = this.statistics.averageResponseTime || 0;
        this.statistics.averageResponseTime = ((current * (total - 1)) + attempt.responseTime) / total;
    } else {
        this.statistics.failedDeliveries += 1;
        this.statistics.lastFailureAt = new Date();
        this.status.consecutiveFailures += 1;

        // Calculate next retry
        if (this.retryPolicy.enabled && eventLog.totalAttempts < this.retryPolicy.maxAttempts) {
            const delay = this.retryPolicy.retryDelay * Math.pow(
                this.retryPolicy.backoffMultiplier,
                eventLog.totalAttempts - 1
            );
            eventLog.nextRetryAt = new Date(Date.now() + delay);
            eventLog.status = 'pending';
        } else {
            eventLog.status = 'failed';
        }
    }

    return await this.save();
};

webhookSchema.methods.transformPayload = function (payload) {
    if (!this.transform.enabled) {
        return payload;
    }

    let transformed = { ...payload };

    // Exclude fields
    if (this.transform.excludeFields && this.transform.excludeFields.length > 0) {
        this.transform.excludeFields.forEach(field => {
            delete transformed[field];
        });
    }

    // Add custom fields
    if (this.transform.customFields) {
        transformed = { ...transformed, ...this.transform.customFields };
    }

    // Add metadata
    if (this.transform.includeMetadata) {
        transformed._webhook = {
            id: this._id,
            name: this.name,
            timestamp: new Date().toISOString()
        };
    }

    return transformed;
};

webhookSchema.methods.generateSignature = function (payload) {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
};

webhookSchema.methods.disable = async function (reason, userId) {
    this.isActive = false;
    this.status.health = 'disabled';
    this.status.disabledAt = new Date();
    this.status.disabledReason = reason;
    this.lastModifiedBy = userId;

    return await this.save();
};

webhookSchema.methods.enable = async function (userId) {
    this.isActive = true;
    this.status.health = 'healthy';
    this.status.disabledAt = null;
    this.status.disabledReason = null;
    this.status.consecutiveFailures = 0;
    this.lastModifiedBy = userId;

    return await this.save();
};

webhookSchema.methods.resetStatistics = async function () {
    this.statistics = {
        totalEvents: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 100,
        totalPayloadSize: 0
    };
    this.status.consecutiveFailures = 0;
    this.eventLogs = [];

    return await this.save();
};

webhookSchema.methods.testConnection = async function () {
    const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        webhook: {
            id: this._id,
            name: this.name
        }
    };

    return await this.trigger('webhook.test', testPayload);
};

webhookSchema.methods.getStatistics = function (days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentLogs = this.eventLogs.filter(log => log.triggeredAt >= cutoff);

    const stats = {
        totalEvents: recentLogs.length,
        successfulDeliveries: recentLogs.filter(log => log.status === 'delivered').length,
        failedDeliveries: recentLogs.filter(log => log.status === 'failed').length,
        pendingDeliveries: recentLogs.filter(log => log.status === 'pending').length,
        averageAttempts: 0,
        eventsByType: {}
    };

    // Calculate average attempts
    if (recentLogs.length > 0) {
        stats.averageAttempts = recentLogs.reduce((sum, log) => sum + log.totalAttempts, 0) / recentLogs.length;
    }

    // Group by event type
    recentLogs.forEach(log => {
        stats.eventsByType[log.eventType] = (stats.eventsByType[log.eventType] || 0) + 1;
    });

    stats.successRate = stats.totalEvents > 0
        ? (stats.successfulDeliveries / stats.totalEvents) * 100
        : 0;

    return stats;
};

// Static methods
webhookSchema.statics.findByWorkspace = async function (workspaceId, options = {}) {
    const { isActive, events } = options;

    const query = { workspace: workspaceId };
    if (isActive !== undefined) query.isActive = isActive;
    if (events && events.length > 0) query.events = { $in: events };

    return await this.find(query)
        .populate('createdBy', 'name email avatar')
        .populate('lastModifiedBy', 'name email')
        .sort({ createdAt: -1 });
};

webhookSchema.statics.findByEvent = async function (workspaceId, eventType) {
    return await this.find({
        workspace: workspaceId,
        events: eventType,
        isActive: true,
        'status.health': { $in: ['healthy', 'degraded'] }
    });
};

webhookSchema.statics.findPendingRetries = async function () {
    const now = new Date();

    return await this.find({
        isActive: true,
        'eventLogs': {
            $elemMatch: {
                status: 'pending',
                nextRetryAt: { $lte: now },
                totalAttempts: { $lt: 3 }
            }
        }
    });
};

webhookSchema.statics.findUnhealthy = async function () {
    return await this.find({
        isActive: true,
        'status.health': { $in: ['failing', 'degraded'] }
    })
        .populate('workspace', 'name')
        .populate('createdBy', 'name email');
};

webhookSchema.statics.getWorkspaceStatistics = async function (workspaceId) {
    const webhooks = await this.find({ workspace: workspaceId });

    return {
        total: webhooks.length,
        active: webhooks.filter(w => w.isActive).length,
        healthy: webhooks.filter(w => w.status.health === 'healthy').length,
        failing: webhooks.filter(w => w.status.health === 'failing').length,
        totalEvents: webhooks.reduce((sum, w) => sum + w.statistics.totalEvents, 0),
        totalSuccessful: webhooks.reduce((sum, w) => sum + w.statistics.successfulDeliveries, 0),
        totalFailed: webhooks.reduce((sum, w) => sum + w.statistics.failedDeliveries, 0),
        averageSuccessRate: webhooks.length > 0
            ? webhooks.reduce((sum, w) => sum + w.statistics.successRate, 0) / webhooks.length
            : 0
    };
};

webhookSchema.statics.cleanupOldLogs = async function (days = 90) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.updateMany(
        {},
        {
            $pull: {
                eventLogs: { triggeredAt: { $lt: cutoff } }
            }
        }
    );
};

module.exports = mongoose.model('Webhook', webhookSchema);