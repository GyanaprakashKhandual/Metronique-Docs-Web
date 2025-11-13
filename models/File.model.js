const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    uploadedFilename: {
        type: String,
        required: true,
        unique: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['image', 'video', 'document'],
        default: 'document'
    },
    size: {
        type: Number,
        required: true
    },
    sizeFormatted: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

FileSchema.index({ userId: 1, uploadedAt: -1 });
FileSchema.index({ fileType: 1 });

module.exports = mongoose.model('File', FileSchema);