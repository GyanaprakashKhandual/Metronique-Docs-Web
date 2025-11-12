const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emoji: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const suggestionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['insert', 'delete', 'replace'],
        required: true
    },
    originalText: String,
    suggestedText: String,
    position: {
        start: Number,
        end: Number
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date
}, { _id: false });

const mentionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notified: {
        type: Boolean,
        default: false
    },
    position: Number
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    fileName: String,
    fileType: String,
    fileSize: Number,
    thumbnail: String
}, { _id: false });

const commentSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    html: String,
    mentions: [mentionSchema],
    blockId: String,
    anchorText: String,
    position: {
        start: Number,
        end: Number,
        blockIndex: Number
    },
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    isReply: {
        type: Boolean,
        default: false
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    replyCount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['comment', 'suggestion', 'note', 'question'],
        default: 'comment'
    },
    suggestion: suggestionSchema,
    isResolved: {
        type: Boolean,
        default: false
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    isPinned: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    reactions: [reactionSchema],
    attachments: [attachmentSchema],
    visibility: {
        type: String,
        enum: ['public', 'private', 'collaborators'],
        default: 'collaborators'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dueDate: Date,
    tags: [String],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    version: {
        type: Number,
        default: 1
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    
    // NEW: Parent Comment Thread
    documentSection: String, // For threading
    
    // NEW: Mention Notifications
    mentionNotificationsSent: {
        type: Boolean,
        default: false
    },
    
    // NEW: Edit History
    editHistory: [{
        editedAt: Date,
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        oldContent: String,
        newContent: String
    }],
    
    // NEW: Activity Reference
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    
    // NEW: Linked Issues/Tasks
    linkedIssues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    }]
}, {
    timestamps: true
});

commentSchema.index({ document: 1, createdAt: -1 });
commentSchema.index({ document: 1, blockId: 1 });
commentSchema.index({ document: 1, isResolved: 1 });
commentSchema.index({ thread: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ 'mentions.user': 1 });
commentSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Comment', commentSchema);