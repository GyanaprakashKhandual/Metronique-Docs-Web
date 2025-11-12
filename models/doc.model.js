const mongoose = require('mongoose');

const inlineStyleSchema = new mongoose.Schema({
    bold: Boolean,
    italic: Boolean,
    underline: Boolean,
    strikethrough: Boolean,
    code: Boolean,
    superscript: Boolean,
    subscript: Boolean,
    highlight: Boolean,
    color: String,
    backgroundColor: String,
    fontSize: Number,
    fontFamily: String,
    letterSpacing: Number,
    lineHeight: Number,
    textTransform: {
        type: String,
        enum: ['none', 'uppercase', 'lowercase', 'capitalize']
    },
    textDecoration: String,
    fontWeight: {
        type: Number,
        min: 100,
        max: 900
    }
}, { _id: false });

const blockSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6',
            'bulletList', 'numberedList', 'checkList', 'toggleList',
            'quote', 'callout', 'code', 'codeBlock', 'divider',
            'image', 'video', 'audio', 'file', 'link', 'bookmark',
            'table', 'embed', 'iframe', 'math', 'equation',
            'columns', 'accordion', 'tabs', 'breadcrumb',
            'drawing', 'chart', 'diagram', 'mindmap'
        ],
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed
    },
    text: String,
    html: String,
    markdown: String,
    delta: mongoose.Schema.Types.Mixed,

    styles: inlineStyleSchema,

    blockStyles: {
        align: {
            type: String,
            enum: ['left', 'center', 'right', 'justify']
        },
        direction: {
            type: String,
            enum: ['ltr', 'rtl']
        },
        indent: Number,
        margin: {
            top: Number,
            right: Number,
            bottom: Number,
            left: Number
        },
        padding: {
            top: Number,
            right: Number,
            bottom: Number,
            left: Number
        },
        border: {
            width: Number,
            style: String,
            color: String,
            radius: Number
        },
        backgroundColor: String,
        width: String,
        height: String,
        maxWidth: String,
        display: String
    },

    url: String,
    alt: String,
    title: String,
    width: Number,
    height: Number,
    aspectRatio: String,
    caption: String,
    fileSize: Number,
    fileType: String,
    fileName: String,
    thumbnail: String,

    codeLanguage: {
        type: String,
        enum: [
            'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
            'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala',
            'html', 'css', 'scss', 'sass', 'less',
            'sql', 'bash', 'shell', 'powershell',
            'json', 'xml', 'yaml', 'markdown',
            'jsx', 'tsx', 'vue', 'svelte',
            'dart', 'r', 'matlab', 'julia',
            'plaintext'
        ]
    },
    showLineNumbers: Boolean,
    wrapCode: Boolean,
    theme: {
        type: String,
        enum: ['vs-dark', 'light', 'github', 'monokai', 'dracula', 'nord']
    },

    rows: [[mongoose.Schema.Types.Mixed]],
    columns: Number,
    tableStyles: {
        headerRow: Boolean,
        headerColumn: Boolean,
        borderCollapse: Boolean,
        cellPadding: Number,
        cellSpacing: Number
    },

    embedUrl: String,
    embedType: {
        type: String,
        enum: ['youtube', 'vimeo', 'twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'spotify', 'soundcloud', 'figma', 'codepen', 'github', 'maps', 'custom']
    },
    embedHtml: String,

    linkUrl: String,
    linkText: String,
    linkTarget: {
        type: String,
        enum: ['_self', '_blank'],
        default: '_self'
    },

    checked: Boolean,
    collapsed: Boolean,

    level: Number,
    order: Number,

    listType: {
        type: String,
        enum: ['disc', 'circle', 'square', 'decimal', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman']
    },

    calloutType: {
        type: String,
        enum: ['info', 'warning', 'error', 'success', 'note', 'tip']
    },
    calloutIcon: String,

    chartType: {
        type: String,
        enum: ['bar', 'line', 'pie', 'doughnut', 'area', 'scatter', 'radar']
    },
    chartData: mongoose.Schema.Types.Mixed,
    chartOptions: mongoose.Schema.Types.Mixed,

    mathFormula: String,
    mathDisplay: {
        type: String,
        enum: ['inline', 'block']
    },

    columnCount: Number,
    columnGap: Number,

    tabLabels: [String],
    activeTab: Number,

    children: [mongoose.Schema.Types.Mixed],
    parent: String,

    metadata: {
        createdAt: Date,
        updatedAt: Date,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Untitled Document'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        blocks: [blockSchema],
        version: {
            type: Number,
            default: 1
        }
    },

    pageSettings: {
        width: {
            type: String,
            default: '816px'
        },
        margin: {
            top: Number,
            right: Number,
            bottom: Number,
            left: Number
        },
        orientation: {
            type: String,
            enum: ['portrait', 'landscape'],
            default: 'portrait'
        },
        size: {
            type: String,
            enum: ['A4', 'Letter', 'Legal', 'A3', 'A5', 'Custom'],
            default: 'A4'
        },
        backgroundColor: String,
        backgroundImage: String
    },

    defaultFont: {
        family: {
            type: String,
            default: 'Inter'
        },
        size: {
            type: Number,
            default: 16
        },
        lineHeight: {
            type: Number,
            default: 1.5
        }
    },
    // NEW: Workspace Reference (CRITICAL)
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
        index: true
    },

    // NEW: Version Management
    currentVersion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentVersion'
    },
    totalVersions: {
        type: Number,
        default: 1
    },

    // NEW: Lock Management
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lockedAt: Date,
    lockExpires: Date,

    // NEW: Parent Document (for copies)
    parentDocument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },

    // NEW: Related Documents
    relatedDocuments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],

    // NEW: Template Reference
    templateUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    },

    // NEW: Activity Reference
    latestActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },

    // NEW: Comment Count (for optimization)
    commentCount: {
        type: Number,
        default: 0
    },
    unresolvedCommentCount: {
        type: Number,
        default: 0
    },

    // NEW: Collaborator Optimization
    collaboratorCount: {
        type: Number,
        default: 0
    },

    // NEW: Metrics
    viewCount: {
        type: Number,
        default: 0
    },
    editCount: {
        type: Number,
        default: 0
    },
    lastViewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastViewedAt: Date,

    // NEW: Share References
    documentShares: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentShare'
    }],

    // NEW: Access Control
    permissions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['viewer', 'commenter', 'editor', 'owner']
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // NEW: Export History
    recentExports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Export'
    }],

    coverImage: String,
    icon: String,

    isPublic: {
        type: Boolean,
        default: false
    },
    isTemplate: {
        type: Boolean,
        default: false
    },

    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },

    tags: [String],

    starred: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['viewer', 'commenter', 'editor', 'owner'],
            default: 'viewer'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],

    shareSettings: {
        linkAccess: {
            type: String,
            enum: ['restricted', 'anyone_with_link'],
            default: 'restricted'
        },
        linkRole: {
            type: String,
            enum: ['viewer', 'commenter', 'editor'],
            default: 'viewer'
        },
        allowComments: {
            type: Boolean,
            default: true
        },
        allowDownload: {
            type: Boolean,
            default: true
        },
        allowCopy: {
            type: Boolean,
            default: true
        },
        allowPrint: {
            type: Boolean,
            default: true
        },
        expiresAt: Date,
        password: String
    },

    viewCount: {
        type: Number,
        default: 0
    },

    isArchived: {
        type: Boolean,
        default: false
    },

    isTrashed: {
        type: Boolean,
        default: false
    },

    trashedAt: Date,
    permanentDeleteAt: Date,

    wordCount: {
        type: Number,
        default: 0
    },

    readingTime: {
        type: Number,
        default: 0
    },

    language: {
        type: String,
        default: 'en'
    }
}, {
    timestamps: true
});

documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ title: 'text' });
documentSchema.index({ 'collaborators.user': 1 });
documentSchema.index({ isTrashed: 1, trashedAt: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Document', documentSchema);
