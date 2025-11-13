const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,sparse: true,
        required: true
    },
    permissions: {
        documents: {
            create: { type: Boolean, default: true },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: true },
            delete: { type: Boolean, default: false },
            share: { type: Boolean, default: true },
            export: { type: Boolean, default: true },
            comment: { type: Boolean, default: true }
        },
        folders: {
            create: { type: Boolean, default: true },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: true },
            delete: { type: Boolean, default: false },
            share: { type: Boolean, default: true }
        },
        templates: {
            create: { type: Boolean, default: false },
            read: { type: Boolean, default: true },
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            publish: { type: Boolean, default: false }
        },
        members: {
            invite: { type: Boolean, default: false },
            remove: { type: Boolean, default: false },
            updateRoles: { type: Boolean, default: false }
        },
        workspace: {
            update: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            billing: { type: Boolean, default: false },
            settings: { type: Boolean, default: false },
            integrations: { type: Boolean, default: false },
            analytics: { type: Boolean, default: false }
        }
    },
    isCustom: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    priority: Number
}, { _id: false });

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'guest'],
        default: 'member'
    },
    customRole: String,
    status: {
        type: String,
        enum: ['active', 'invited', 'suspended', 'removed'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invitedAt: Date,
    lastActiveAt: Date,
    permissions: {
        canCreateDocuments: { type: Boolean, default: true },
        canCreateFolders: { type: Boolean, default: true },
        canInviteMembers: { type: Boolean, default: false },
        canManageSettings: { type: Boolean, default: false }
    },
    metadata: {
        department: String,
        jobTitle: String,
        team: String,
        location: String
    }
}, { _id: false });

const invitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['admin', 'member', 'guest'],
        default: 'member'
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired', 'revoked'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    acceptedAt: Date,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const billingSchema = new mongoose.Schema({
    plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'business', 'enterprise'],
        default: 'free'
    },
    status: {
        type: String,
        enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
        default: 'active'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    amount: Number,
    currency: {
        type: String,
        default: 'USD'
    },
    nextBillingDate: Date,
    trialEndsAt: Date,
    canceledAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    paymentMethod: {
        type: String,
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number
    }
}, { _id: false });

const usageSchema = new mongoose.Schema({
    documents: {
        count: { type: Number, default: 0 },
        limit: Number,
        unlimited: { type: Boolean, default: false }
    },
    storage: {
        used: { type: Number, default: 0 },
        limit: Number,
        unit: { type: String, default: 'GB' },
        unlimited: { type: Boolean, default: false }
    },
    members: {
        count: { type: Number, default: 0 },
        limit: Number,
        unlimited: { type: Boolean, default: false }
    },
    apiCalls: {
        count: { type: Number, default: 0 },
        limit: Number,
        resetDate: Date
    },
    exports: {
        count: { type: Number, default: 0 },
        limit: Number,
        resetDate: Date
    }
}, { _id: false });

const integrationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['storage', 'communication', 'productivity', 'crm', 'analytics', 'custom'],
        required: true
    },
    provider: String,
    isEnabled: {
        type: Boolean,
        default: true
    },
    credentials: {
        apiKey: String,
        accessToken: String,
        refreshToken: String,
        expiresAt: Date
    },
    config: mongoose.Schema.Types.Mixed,
    webhookUrl: String,
    lastSyncAt: Date,
    connectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    connectedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: String,
    logo: String,
    banner: String,
    color: {
        type: String,
        default: '#3b82f6'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    members: [memberSchema],
    invitations: [invitationSchema],
    customRoles: [roleSchema],
    type: {
        type: String,
        enum: ['personal', 'team', 'organization', 'enterprise'],
        default: 'team'
    },
    visibility: {
        type: String,
        enum: ['private', 'public', 'unlisted'],
        default: 'private'
    },
    domain: String,
    allowedDomains: [String],
    settings: {
        defaultDocumentVisibility: {
            type: String,
            enum: ['private', 'workspace', 'public'],
            default: 'workspace'
        },
        requireApprovalForSharing: {
            type: Boolean,
            default: false
        },
        allowGuestAccess: {
            type: Boolean,
            default: true
        },
        allowPublicDocuments: {
            type: Boolean,
            default: true
        },
        allowExternalSharing: {
            type: Boolean,
            default: true
        },
        autoDeleteTrashedDocs: {
            type: Boolean,
            default: true
        },
        trashRetentionDays: {
            type: Number,
            default: 30
        },
        enableVersionHistory: {
            type: Boolean,
            default: true
        },
        versionRetentionDays: {
            type: Number,
            default: 90
        },
        enableComments: {
            type: Boolean,
            default: true
        },
        enableSuggestions: {
            type: Boolean,
            default: true
        },
        enableRealTimeCollaboration: {
            type: Boolean,
            default: true
        },
        requireTwoFactor: {
            type: Boolean,
            default: false
        },
        allowedFileTypes: [String],
        maxFileSize: {
            type: Number,
            default: 100
        },
        watermarkEnabled: {
            type: Boolean,
            default: false
        },
        watermarkText: String,
        brandingEnabled: {
            type: Boolean,
            default: false
        }
    },
    security: {
        ipWhitelist: [String],
        allowedCountries: [String],
        sessionTimeout: Number,
        passwordPolicy: {
            minLength: { type: Number, default: 8 },
            requireUppercase: { type: Boolean, default: true },
            requireLowercase: { type: Boolean, default: true },
            requireNumbers: { type: Boolean, default: true },
            requireSymbols: { type: Boolean, default: false },
            expiryDays: Number
        },
        sso: {
            enabled: { type: Boolean, default: false },
            provider: String,
            domain: String,
            settings: mongoose.Schema.Types.Mixed
        },
        auditLog: {
            enabled: { type: Boolean, default: true },
            retentionDays: { type: Number, default: 365 }
        },
        dataEncryption: {
            enabled: { type: Boolean, default: false },
            algorithm: String
        }
    },
    billing: billingSchema,
    usage: usageSchema,
    integrations: [integrationSchema],
    notifications: {
        email: {
            enabled: { type: Boolean, default: true },
            frequency: {
                type: String,
                enum: ['instant', 'daily', 'weekly'],
                default: 'instant'
            }
        },
        slack: {
            enabled: { type: Boolean, default: false },
            webhookUrl: String,
            channel: String
        },
        webhook: {
            enabled: { type: Boolean, default: false },
            url: String,
            events: [String]
        }
    },
    features: {
        advancedPermissions: { type: Boolean, default: false },
        customBranding: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        advancedSecurity: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        customIntegrations: { type: Boolean, default: false },
        aiAssistant: { type: Boolean, default: false }
    },
    statistics: {
        totalDocuments: { type: Number, default: 0 },
        totalFolders: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },
        totalActivities: { type: Number, default: 0 },
        activeMembers: { type: Number, default: 0 },
        storageUsed: { type: Number, default: 0 },
        lastActivityAt: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspendedAt: Date,
    suspensionReason: String,
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    metadata: {
        industry: String,
        companySize: String,
        country: String,
        timezone: String,
        language: {
            type: String,
            default: 'en'
        }
    },
    recentActivities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],

    // NEW: Workspace Integrations (better reference)
    connectedIntegrations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Integration'
    }],

    // NEW: Workspace Webhooks
    webhooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Webhook'
    }]
}, {
    timestamps: true
});

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ slug: 1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ domain: 1 });
workspaceSchema.index({ isActive: 1, isSuspended: 1 });
workspaceSchema.index({ 'billing.status': 1 });
workspaceSchema.index({ name: 'text', description: 'text' });

workspaceSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Calculate active members
    this.statistics.activeMembers = this.members.filter(m => m.status === 'active').length;

    // Initialize usage.members if it doesn't exist
    if (!this.usage) {
        this.usage = {};
    }
    
    if (!this.usage.members) {
        this.usage.members = {
            count: 0,
            limit: null,
            unlimited: false
        };
    }

    // Update member count
    this.usage.members.count = this.members.filter(m => m.status === 'active').length;

    next();
});

workspaceSchema.methods.addMember = function (userId, role = 'member', invitedBy) {
    const existingMember = this.members.find(m => m.user.toString() === userId.toString());

    if (existingMember) {
        throw new Error('User is already a member of this workspace');
    }

    this.members.push({
        user: userId,
        role,
        invitedBy,
        invitedAt: new Date()
    });

    return this.save();
};

workspaceSchema.methods.removeMember = function (userId) {
    const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());

    if (memberIndex === -1) {
        throw new Error('User is not a member of this workspace');
    }

    if (this.members[memberIndex].role === 'owner') {
        throw new Error('Cannot remove workspace owner');
    }

    this.members[memberIndex].status = 'removed';

    return this.save();
};

workspaceSchema.methods.updateMemberRole = function (userId, newRole) {
    const member = this.members.find(m => m.user.toString() === userId.toString());

    if (!member) {
        throw new Error('User is not a member of this workspace');
    }

    if (member.role === 'owner') {
        throw new Error('Cannot change owner role');
    }

    member.role = newRole;

    return this.save();
};

workspaceSchema.methods.inviteMember = function (email, role, invitedBy, message) {
    const token = mongoose.Types.ObjectId().toString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    this.invitations.push({
        email,
        role,
        invitedBy,
        token,
        expiresAt,
        message
    });

    return this.save();
};

workspaceSchema.methods.acceptInvitation = function (token, userId) {
    const invitation = this.invitations.find(inv => inv.token === token);

    if (!invitation) {
        throw new Error('Invalid invitation token');
    }

    if (invitation.status !== 'pending') {
        throw new Error('Invitation has already been processed');
    }

    if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
        throw new Error('Invitation has expired');
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();

    this.members.push({
        user: userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt
    });

    return this.save();
};

workspaceSchema.methods.checkPermission = function (userId, resource, action) {
    const member = this.members.find(m =>
        m.user.toString() === userId.toString() && m.status === 'active'
    );

    if (!member) {
        return false;
    }

    if (member.role === 'owner') {
        return true;
    }

    if (member.customRole) {
        const customRole = this.customRoles.find(r => r.name === member.customRole);
        if (customRole && customRole.permissions[resource]) {
            return customRole.permissions[resource][action];
        }
    }

    const defaultPermissions = {
        admin: { documents: true, folders: true, templates: true, members: true, workspace: true },
        member: { documents: true, folders: true, templates: false, members: false, workspace: false },
        guest: { documents: false, folders: false, templates: false, members: false, workspace: false }
    };

    return defaultPermissions[member.role]?.[resource] || false;
};

workspaceSchema.methods.updateUsage = function (type, amount) {
    if (this.usage[type]) {
        this.usage[type].used = (this.usage[type].used || 0) + amount;
    }

    return this.save();
};

workspaceSchema.statics.findByMember = async function (userId) {
    return await this.find({
        'members.user': userId,
        'members.status': 'active',
        isActive: true,
        isDeleted: false
    }).populate('owner', 'name email avatar');
};

workspaceSchema.statics.findBySlug = async function (slug) {
    return await this.findOne({ slug, isActive: true, isDeleted: false })
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');
};

module.exports = mongoose.model('Workspace', workspaceSchema);