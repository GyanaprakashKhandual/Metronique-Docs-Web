const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    id: String,
    type: {
        type: String,
        enum: [
            'paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6',
            'bulletList', 'numberedList', 'checkList', 'toggleList',
            'quote', 'callout', 'code', 'codeBlock', 'divider',
            'image', 'video', 'audio', 'file', 'link', 'bookmark',
            'table', 'embed', 'iframe', 'math', 'equation',
            'columns', 'accordion', 'tabs', 'breadcrumb',
            'drawing', 'chart', 'diagram', 'mindmap', 'placeholder'
        ]
    },
    content: mongoose.Schema.Types.Mixed,
    text: String,
    styles: mongoose.Schema.Types.Mixed,
    blockStyles: mongoose.Schema.Types.Mixed,
    isEditable: {
        type: Boolean,
        default: true
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    placeholder: String,
    children: [mongoose.Schema.Types.Mixed]
}, { _id: false });

const variableSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    label: String,
    type: {
        type: String,
        enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'user', 'email', 'url', 'phone'],
        default: 'text'
    },
    defaultValue: mongoose.Schema.Types.Mixed,
    options: [String],
    validation: {
        required: Boolean,
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number,
        pattern: String,
        format: String
    },
    placeholder: String,
    description: String,
    position: Number
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    title: String,
    description: String,
    blocks: [blockSchema],
    isOptional: {
        type: Boolean,
        default: false
    },
    isRepeatable: {
        type: Boolean,
        default: false
    },
    order: Number,
    minRepeat: {
        type: Number,
        default: 1
    },
    maxRepeat: Number
}, { _id: false });

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    thumbnail: String,
    previewImages: [String],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: [
            'business',
            'education',
            'personal',
            'creative',
            'legal',
            'marketing',
            'technical',
            'project-management',
            'hr',
            'finance',
            'sales',
            'design',
            'engineering',
            'academic',
            'meeting-notes',
            'reports',
            'proposals',
            'contracts',
            'resumes',
            'letters',
            'invoices',
            'presentations',
            'other'
        ],
        required: true,
        index: true
    },
    subcategory: String,
    tags: [String],
    content: {
        sections: [sectionSchema],
        blocks: [blockSchema],
        version: {
            type: Number,
            default: 1
        }
    },
    variables: [variableSchema],
    pageSettings: {
        width: String,
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
        family: String,
        size: Number,
        lineHeight: Number
    },
    coverImage: String,
    icon: String,
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    isOfficial: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'workspace', 'organization'],
        default: 'private'
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    accessControl: {
        allowedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        allowedWorkspaces: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace'
        }],
        allowedDomains: [String],
        requireApproval: {
            type: Boolean,
            default: false
        }
    },
    usage: {
        useCount: {
            type: Number,
            default: 0
        },
        lastUsedAt: Date,
        uniqueUsers: {
            type: Number,
            default: 0
        },
        documentsCreated: {
            type: Number,
            default: 0
        }
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        },
        distribution: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 }
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        helpful: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    favoriteCount: {
        type: Number,
        default: 0
    },
    version: {
        number: {
            type: String,
            default: '1.0.0'
        },
        changelog: String,
        publishedAt: Date
    },
    compatibility: {
        minAppVersion: String,
        maxAppVersion: String,
        features: [String]
    },
    localization: {
        languages: [{
            code: String,
            name: String,
            isDefault: Boolean
        }],
        defaultLanguage: {
            type: String,
            default: 'en'
        }
    },
    metadata: {
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        },
        estimatedTime: Number,
        wordCount: Number,
        blockCount: Number,
        industries: [String],
        useCases: [String],
        roles: [String],
        fileSize: Number
    },
    customization: {
        allowTitleChange: {
            type: Boolean,
            default: true
        },
        allowStructureChange: {
            type: Boolean,
            default: true
        },
        allowStyleChange: {
            type: Boolean,
            default: true
        },
        allowContentChange: {
            type: Boolean,
            default: true
        },
        lockedBlocks: [String],
        protectedSections: [String]
    },
    relatedTemplates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    }],
    parentTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    },
    variations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    publishedAt: Date,
    lastModifiedBy: {
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
            enum: ['viewer', 'editor', 'admin'],
            default: 'viewer'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    seo: {
        keywords: [String],
        metaDescription: String,
        slug: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        previews: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        lastViewedAt: Date,
         workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    
    // NEW: Last Modified Reference
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // NEW: Documents Created from This Template
    documentsCreated: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],
    
    // NEW: Template Versions
    templateVersions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TemplateVersion'
    }]
    }
}, {
    timestamps: true
});

templateSchema.index({ creator: 1, createdAt: -1 });
templateSchema.index({ category: 1, isPublic: 1 });
templateSchema.index({ name: 'text', description: 'text' });
templateSchema.index({ tags: 1 });
templateSchema.index({ isPublic: 1, isFeatured: 1 });
templateSchema.index({ 'ratings.average': -1 });
templateSchema.index({ 'usage.useCount': -1 });
templateSchema.index({ workspace: 1 });
templateSchema.index({ organization: 1 });
templateSchema.index({ 'seo.slug': 1 });
templateSchema.index({ isActive: 1, isArchived: 1 });

templateSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.seo.slug) {
        this.seo.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    if (this.content && this.content.blocks) {
        this.metadata.blockCount = this.content.blocks.length;
    }

    if (this.isModified('reviews')) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.ratings.count = this.reviews.length;
        this.ratings.average = this.reviews.length > 0 ? totalRating / this.reviews.length : 0;

        this.ratings.distribution = {
            five: this.reviews.filter(r => r.rating === 5).length,
            four: this.reviews.filter(r => r.rating === 4).length,
            three: this.reviews.filter(r => r.rating === 3).length,
            two: this.reviews.filter(r => r.rating === 2).length,
            one: this.reviews.filter(r => r.rating === 1).length
        };
    }

    this.favoriteCount = this.favorites.length;

    next();
});

templateSchema.methods.use = async function (userId) {
    this.usage.useCount += 1;
    this.usage.lastUsedAt = new Date();
    this.usage.documentsCreated += 1;

    const userUsedBefore = await this.constructor.findOne({
        _id: this._id,
        'usage.usedBy': userId
    });

    if (!userUsedBefore) {
        this.usage.uniqueUsers += 1;
    }

    return await this.save();
};

templateSchema.methods.addReview = function (userId, rating, comment) {
    const existingReviewIndex = this.reviews.findIndex(
        r => r.user.toString() === userId.toString()
    );

    if (existingReviewIndex > -1) {
        this.reviews[existingReviewIndex].rating = rating;
        this.reviews[existingReviewIndex].comment = comment;
    } else {
        this.reviews.push({ user: userId, rating, comment });
    }

    return this.save();
};

templateSchema.methods.toggleFavorite = function (userId) {
    const index = this.favorites.indexOf(userId);

    if (index > -1) {
        this.favorites.splice(index, 1);
    } else {
        this.favorites.push(userId);
    }

    return this.save();
};

templateSchema.statics.getPopular = async function (limit = 10) {
    return await this.find({
        isPublic: true,
        isActive: true,
        isArchived: false
    })
        .sort({ 'usage.useCount': -1 })
        .limit(limit)
        .populate('creator', 'name avatar');
};

templateSchema.statics.getFeatured = async function (limit = 10) {
    return await this.find({
        isPublic: true,
        isFeatured: true,
        isActive: true,
        isArchived: false
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('creator', 'name avatar');
};

templateSchema.statics.getByCategory = async function (category, options = {}) {
    const { limit = 20, skip = 0, sort = '-usage.useCount' } = options;

    return await this.find({
        category,
        isPublic: true,
        isActive: true,
        isArchived: false
    })
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('creator', 'name avatar');
};

templateSchema.statics.search = async function (query, options = {}) {
    const {
        category,
        tags,
        isPremium,
        difficulty,
        limit = 20,
        skip = 0
    } = options;

    const searchQuery = {
        isPublic: true,
        isActive: true,
        isArchived: false,
        $text: { $search: query }
    };

    if (category) searchQuery.category = category;
    if (tags && tags.length > 0) searchQuery.tags = { $in: tags };
    if (isPremium !== undefined) searchQuery.isPremium = isPremium;
    if (difficulty) searchQuery['metadata.difficulty'] = difficulty;

    return await this.find(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .skip(skip)
        .populate('creator', 'name avatar');
};

templateSchema.statics.getWorkspaceTemplates = async function (workspaceId) {
    return await this.find({
        $or: [
            { workspace: workspaceId },
            { 'accessControl.allowedWorkspaces': workspaceId }
        ],
        isActive: true,
        isArchived: false
    })
        .sort({ createdAt: -1 })
        .populate('creator', 'name avatar');
};

module.exports = mongoose.model('Template', templateSchema);