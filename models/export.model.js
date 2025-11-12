const mongoose = require('mongoose');

const exportOptionsSchema = new mongoose.Schema({
    includeComments: {
        type: Boolean,
        default: false
    },
    includeVersionHistory: {
        type: Boolean,
        default: false
    },
    includeMetadata: {
        type: Boolean,
        default: true
    },
    pageSize: {
        type: String,
        enum: ['A4', 'Letter', 'Legal', 'A3', 'A5'],
        default: 'A4'
    },
    orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait'
    },
    margins: {
        top: { type: Number, default: 1 }, // in inches
        right: { type: Number, default: 1 },
        bottom: { type: Number, default: 1 },
        left: { type: Number, default: 1 }
    },
    headerFooter: {
        includeHeader: { type: Boolean, default: false },
        includeFooter: { type: Boolean, default: false },
        headerText: String,
        footerText: String,
        includePageNumbers: { type: Boolean, default: true }
    },
    watermark: {
        enabled: { type: Boolean, default: false },
        text: String,
        opacity: { type: Number, default: 0.3 },
        rotation: { type: Number, default: -45 }
    },
    quality: {
        type: String,
        enum: ['low', 'medium', 'high', 'print'],
        default: 'high'
    },
    compression: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
        default: 'medium'
    },
    colorSpace: {
        type: String,
        enum: ['RGB', 'CMYK', 'Grayscale'],
        default: 'RGB'
    },
    embedFonts: {
        type: Boolean,
        default: true
    },
    imageQuality: {
        type: Number,
        min: 1,
        max: 100,
        default: 85
    },
    // Markdown specific
    syntaxHighlighting: {
        type: Boolean,
        default: true
    },
    includeTableOfContents: {
        type: Boolean,
        default: false
    },
    // HTML specific
    inlineCSS: {
        type: Boolean,
        default: true
    },
    minify: {
        type: Boolean,
        default: false
    },
    // DOCX specific
    compatibilityMode: {
        type: String,
        enum: ['modern', 'office2007', 'office2003'],
        default: 'modern'
    },
    trackChanges: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const processingStageSchema = new mongoose.Schema({
    stage: {
        type: String,
        enum: [
            'queued',
            'validating',
            'fetching_content',
            'processing_blocks',
            'rendering',
            'compressing',
            'uploading',
            'completed',
            'failed'
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped'],
        default: 'pending'
    },
    startedAt: Date,
    completedAt: Date,
    duration: Number, // in milliseconds
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    error: String,
    metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

const exportSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    documentTitle: String,
    documentVersion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentVersion'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        index: true
    },
    format: {
        type: String,
        enum: [
            'pdf',
            'docx',
            'doc',
            'odt',
            'rtf',
            'txt',
            'html',
            'markdown',
            'json',
            'xml',
            'epub',
            'latex'
        ],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: [
            'queued',
            'processing',
            'completed',
            'failed',
            'cancelled',
            'expired'
        ],
        default: 'queued',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    currentStage: {
        type: String,
        default: 'queued'
    },
    stages: [processingStageSchema],
    options: exportOptionsSchema,
    file: {
        url: String,
        cloudUrl: String,
        fileName: String,
        fileSize: Number, // in bytes
        mimeType: String,
        path: String,
        bucket: String,
        key: String,
        checksum: String,
        uploadedAt: Date
    },
    download: {
        url: String,
        signedUrl: String,
        expiresAt: Date,
        downloadCount: {
            type: Number,
            default: 0
        },
        lastDownloadedAt: Date,
        maxDownloads: Number,
        requireAuth: {
            type: Boolean,
            default: true
        }
    },
    processing: {
        startedAt: Date,
        completedAt: Date,
        duration: Number, // in milliseconds
        retryCount: {
            type: Number,
            default: 0
        },
        maxRetries: {
            type: Number,
            default: 3
        },
        worker: String,
        jobId: String,
        queuePosition: Number
    },
    error: {
        message: String,
        code: String,
        stack: String,
        timestamp: Date,
        stage: String,
        retryable: {
            type: Boolean,
            default: true
        }
    },
    metadata: {
        pageCount: Number,
        wordCount: Number,
        characterCount: Number,
        imageCount: Number,
        tableCount: Number,
        blockCount: Number,
        generatedBy: String,
        generatedAt: Date
    },
    notification: {
        sent: {
            type: Boolean,
            default: false
        },
        sentAt: Date,
        method: {
            type: String,
            enum: ['email', 'push', 'webhook'],
            default: 'email'
        },
        recipient: String
    },
    source: {
        type: String,
        enum: ['web', 'mobile', 'api', 'scheduled', 'bulk'],
        default: 'web'
    },
    requestInfo: {
        ipAddress: String,
        userAgent: String,
        referer: String
    },
    expiresAt: {
        type: Date,
        index: true
    },
    autoDelete: {
        type: Boolean,
        default: true
    },
    deletedAt: Date,
    isBulkExport: {
        type: Boolean,
        default: false
    },
    bulkExportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BulkExport'
    },
    parentExport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Export'
    },
    share: {
        isShared: {
            type: Boolean,
            default: false
        },
        shareToken: String,
        shareUrl: String,
        sharedAt: Date,
        sharedWith: [String], // email addresses
        accessCount: {
            type: Number,
            default: 0
        }
    },
    analytics: {
        viewCount: {
            type: Number,
            default: 0
        },
        uniqueViewers: {
            type: Number,
            default: 0
        },
        averageViewDuration: Number,
        lastViewedAt: Date
    },
    tags: [String],
    notes: String,
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    
    // NEW: Version Reference (export specific version)
    documentVersion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentVersion'
    }
}, {
    timestamps: true
});

// Indexes
exportSchema.index({ user: 1, status: 1, createdAt: -1 });
exportSchema.index({ document: 1, format: 1 });
exportSchema.index({ workspace: 1, createdAt: -1 });
exportSchema.index({ status: 1, 'processing.startedAt': 1 });
exportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exportSchema.index({ 'file.key': 1 });
exportSchema.index({ 'share.shareToken': 1 });
exportSchema.index({ 'processing.jobId': 1 });

// Pre-save middleware
exportSchema.pre('save', function (next) {
    // Set expiry date if not set (default 7 days)
    if (!this.expiresAt && this.autoDelete) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        this.expiresAt = new Date(Date.now() + sevenDays);
    }

    // Update current stage based on stages array
    if (this.stages && this.stages.length > 0) {
        const currentStageObj = this.stages[this.stages.length - 1];
        this.currentStage = currentStageObj.stage;
    }

    // Calculate processing duration
    if (this.processing.startedAt && this.processing.completedAt) {
        this.processing.duration = this.processing.completedAt - this.processing.startedAt;
    }

    // Set file name if not set
    if (!this.file.fileName && this.documentTitle) {
        const sanitized = this.documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        this.file.fileName = `${sanitized}_${Date.now()}.${this.format}`;
    }

    next();
});

// Instance methods
exportSchema.methods.updateProgress = function (progress, stage) {
    this.progress = Math.min(100, Math.max(0, progress));

    if (stage) {
        const stageIndex = this.stages.findIndex(s => s.stage === stage);
        if (stageIndex !== -1) {
            this.stages[stageIndex].progress = progress;
            this.stages[stageIndex].status = 'in_progress';
        }
    }

    return this.save();
};

exportSchema.methods.addStage = function (stage, status = 'pending') {
    this.stages.push({
        stage,
        status,
        startedAt: status === 'in_progress' ? new Date() : null
    });
    return this.save();
};

exportSchema.methods.completeStage = function (stage, metadata) {
    const stageObj = this.stages.find(s => s.stage === stage);
    if (stageObj) {
        stageObj.status = 'completed';
        stageObj.completedAt = new Date();
        if (stageObj.startedAt) {
            stageObj.duration = stageObj.completedAt - stageObj.startedAt;
        }
        if (metadata) {
            stageObj.metadata = metadata;
        }
    }
    return this.save();
};

exportSchema.methods.failStage = function (stage, error) {
    const stageObj = this.stages.find(s => s.stage === stage);
    if (stageObj) {
        stageObj.status = 'failed';
        stageObj.completedAt = new Date();
        stageObj.error = error;
    }
    return this.save();
};

exportSchema.methods.markAsCompleted = async function (fileData) {
    this.status = 'completed';
    this.progress = 100;
    this.processing.completedAt = new Date();

    if (fileData) {
        this.file = { ...this.file, ...fileData };
    }

    // Generate download URL
    if (this.file.url) {
        this.download.url = this.file.url;
        // Set expiry for download link (24 hours)
        this.download.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    return await this.save();
};

exportSchema.methods.markAsFailed = async function (error, stage) {
    this.status = 'failed';
    this.error = {
        message: error.message || error,
        code: error.code,
        stack: error.stack,
        timestamp: new Date(),
        stage: stage || this.currentStage,
        retryable: this.processing.retryCount < this.processing.maxRetries
    };

    if (stage) {
        this.failStage(stage, error.message || error);
    }

    return await this.save();
};

exportSchema.methods.retry = async function () {
    if (this.processing.retryCount >= this.processing.maxRetries) {
        throw new Error('Maximum retry attempts reached');
    }

    this.processing.retryCount += 1;
    this.status = 'queued';
    this.progress = 0;
    this.error = {};

    // Reset stages
    this.stages = this.stages.map(stage => ({
        ...stage,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        duration: null,
        error: null
    }));

    return await this.save();
};

exportSchema.methods.cancel = async function () {
    if (this.status === 'completed') {
        throw new Error('Cannot cancel completed export');
    }

    this.status = 'cancelled';
    this.processing.completedAt = new Date();

    return await this.save();
};

exportSchema.methods.generateDownloadUrl = function (expiresIn = 86400) {
    // This would integrate with your storage service (S3, etc.)
    // For now, just update the expiry
    this.download.expiresAt = new Date(Date.now() + expiresIn * 1000);
    return this.save();
};

exportSchema.methods.incrementDownload = function () {
    this.download.downloadCount += 1;
    this.download.lastDownloadedAt = new Date();

    // Check max downloads limit
    if (this.download.maxDownloads &&
        this.download.downloadCount >= this.download.maxDownloads) {
        this.download.url = null;
        this.download.signedUrl = null;
    }

    return this.save();
};

exportSchema.methods.createShare = function (emails = []) {
    const token = require('crypto').randomBytes(32).toString('hex');

    this.share = {
        isShared: true,
        shareToken: token,
        shareUrl: `${process.env.APP_URL}/exports/shared/${token}`,
        sharedAt: new Date(),
        sharedWith: emails,
        accessCount: 0
    };

    return this.save();
};

exportSchema.methods.extendExpiry = function (days = 7) {
    const extension = days * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + extension);
    return this.save();
};

// Static methods
exportSchema.statics.findByUser = async function (userId, options = {}) {
    const { status, format, limit = 20, skip = 0 } = options;

    const query = { user: userId };
    if (status) query.status = status;
    if (format) query.format = format;

    return await this.find(query)
        .populate('document', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

exportSchema.statics.findByDocument = async function (documentId, options = {}) {
    const { format, limit = 10 } = options;

    const query = { document: documentId, status: 'completed' };
    if (format) query.format = format;

    return await this.find(query)
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit);
};

exportSchema.statics.findPending = async function () {
    return await this.find({
        status: { $in: ['queued', 'processing'] },
        'processing.retryCount': { $lt: 3 }
    })
        .sort({ priority: -1, createdAt: 1 })
        .limit(50);
};

exportSchema.statics.findExpired = async function () {
    const now = new Date();
    return await this.find({
        expiresAt: { $lt: now },
        status: 'completed',
        autoDelete: true
    });
};

exportSchema.statics.findStalled = async function (minutes = 30) {
    const stalledTime = new Date(Date.now() - minutes * 60 * 1000);

    return await this.find({
        status: 'processing',
        'processing.startedAt': { $lt: stalledTime }
    });
};

exportSchema.statics.getStatsByUser = async function (userId, startDate, endDate) {
    const match = { user: mongoose.Types.ObjectId(userId) };

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    format: '$format',
                    status: '$status'
                },
                count: { $sum: 1 },
                totalSize: { $sum: '$file.fileSize' },
                avgDuration: { $avg: '$processing.duration' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

exportSchema.statics.getWorkspaceUsage = async function (workspaceId) {
    return await this.aggregate([
        { $match: { workspace: mongoose.Types.ObjectId(workspaceId) } },
        {
            $group: {
                _id: null,
                totalExports: { $sum: 1 },
                totalSize: { $sum: '$file.fileSize' },
                completedExports: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                failedExports: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                },
                avgProcessingTime: { $avg: '$processing.duration' }
            }
        }
    ]);
};

exportSchema.statics.cleanupExpired = async function () {
    const expired = await this.findExpired();

    // This would also delete files from storage
    // For now just mark as deleted
    const result = await this.updateMany(
        { _id: { $in: expired.map(e => e._id) } },
        { status: 'expired', deletedAt: new Date() }
    );

    return result;
};

module.exports = mongoose.model('Export', exportSchema);