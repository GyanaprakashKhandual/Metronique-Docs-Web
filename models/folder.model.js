const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
        index: true
    },
    path: {
        type: String,
        index: true
    },
    level: {
        type: Number,
        default: 0
    },
    ancestors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    }],
    color: String,
    icon: String,
    description: String,
    isShared: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    shareSettings: {
        linkAccess: {
            type: String,
            enum: ['restricted', 'anyone_with_link'],
            default: 'restricted'
        },
        linkRole: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'viewer'
        },
        allowSubfolderSharing: {
            type: Boolean,
            default: true
        },
        inheritPermissions: {
            type: Boolean,
            default: true
        }
    },
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['viewer', 'editor', 'owner'],
            default: 'viewer'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    permissions: {
        canCreateDocuments: {
            type: Boolean,
            default: true
        },
        canCreateSubfolders: {
            type: Boolean,
            default: true
        },
        canRename: {
            type: Boolean,
            default: true
        },
        canMove: {
            type: Boolean,
            default: true
        },
        canDelete: {
            type: Boolean,
            default: true
        },
        canShare: {
            type: Boolean,
            default: true
        }
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    starred: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    tags: [String],
    documentCount: {
        type: Number,
        default: 0
    },
    subfolderCount: {
        type: Number,
        default: 0
    },
    totalSize: {
        type: Number,
        default: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lockedAt: Date,
    isTrashed: {
        type: Boolean,
        default: false
    },
    trashedAt: Date,
    trashedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    permanentDeleteAt: Date,
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    sortOrder: {
        field: {
            type: String,
            enum: ['name', 'createdAt', 'updatedAt', 'size'],
            default: 'name'
        },
        direction: {
            type: String,
            enum: ['asc', 'desc'],
            default: 'asc'
        }
    },
    viewSettings: {
        layout: {
            type: String,
            enum: ['grid', 'list', 'table'],
            default: 'list'
        },
        showThumbnails: {
            type: Boolean,
            default: true
        },
        groupBy: String
    },
    metadata: {
        lastAccessedAt: Date,
        accessCount: {
            type: Number,
            default: 0
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
        index: true
    },
    
    // NEW: Recent Activity
    latestActivity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    },
    
    // NEW: Document Count (optimization)
    totalDocumentsCount: {
        type: Number,
        default: 0
    },
    
    // NEW: Shared Folder References
    sharedFolders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentShare'
    }],
    
    // NEW: Last Modified Info
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastModifiedAt: Date
}, {
    timestamps: true
});

folderSchema.index({ owner: 1, parent: 1 });
folderSchema.index({ name: 'text', description: 'text' });
folderSchema.index({ path: 1 });
folderSchema.index({ workspace: 1 });
folderSchema.index({ isTrashed: 1 });
folderSchema.index({ 'collaborators.user': 1 });

folderSchema.pre('save', async function (next) {
    if (this.isModified('parent') || this.isNew) {
        if (this.parent) {
            const parentFolder = await this.constructor.findById(this.parent);
            if (parentFolder) {
                this.level = parentFolder.level + 1;
                this.ancestors = [...parentFolder.ancestors, parentFolder._id];
                this.path = `${parentFolder.path}/${this._id}`;
            }
        } else {
            this.level = 0;
            this.ancestors = [];
            this.path = `/${this._id}`;
        }
    }
    next();
});

folderSchema.methods.getFullPath = async function () {
    const folders = await this.constructor.find({
        _id: { $in: this.ancestors }
    }).select('name').sort({ level: 1 });

    const pathNames = folders.map(f => f.name);
    pathNames.push(this.name);
    return '/' + pathNames.join('/');
};

folderSchema.statics.getDescendants = async function (folderId) {
    return await this.find({
        ancestors: folderId
    });
};

module.exports = mongoose.model('Folder', folderSchema);