const fs = require('fs').promises;
const path = require('path');
const File = require('../models/File.model');
const FileUploadUtils = require('../utils/file.upload.util');
const uploadConfig = require('../configs/upload.config');

class FileUpload {
    static async uploadSingleFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const fileExtension = FileUploadUtils.getFileExtension(req.file.originalname);
            const fileCategory = FileUploadUtils.getFileCategory(fileExtension);
            const fileUrl = FileUploadUtils.buildFileUrl(req.file.filename);

            const fileData = {
                filename: req.file.originalname,
                uploadedFilename: req.file.filename,
                fileUrl: fileUrl,
                mimeType: req.file.mimetype,
                fileType: fileCategory,
                size: req.file.size,
                sizeFormatted: FileUploadUtils.formatFileSize(req.file.size),
                uploadedAt: new Date(),
                userId: req.user.id
            };

            const savedFile = await File.create(fileData);

            return res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    id: savedFile._id,
                    filename: savedFile.filename,
                    uploadedFilename: savedFile.uploadedFilename,
                    fileUrl: savedFile.fileUrl,
                    mimeType: savedFile.mimeType,
                    fileType: savedFile.fileType,
                    size: savedFile.size,
                    sizeFormatted: savedFile.sizeFormatted,
                    uploadedAt: savedFile.uploadedAt
                }
            });
        } catch (error) {
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (err) {
                    console.error('Error deleting file:', err);
                }
            }

            return res.status(500).json({
                success: false,
                message: 'File upload failed',
                error: error.message
            });
        }
    }

    static async uploadMultipleFiles(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            const uploadedFiles = [];

            for (const file of req.files) {
                try {
                    const fileExtension = FileUploadUtils.getFileExtension(file.originalname);
                    const fileCategory = FileUploadUtils.getFileCategory(fileExtension);
                    const fileUrl = FileUploadUtils.buildFileUrl(file.filename);

                    const fileData = {
                        filename: file.originalname,
                        uploadedFilename: file.filename,
                        fileUrl: fileUrl,
                        mimeType: file.mimetype,
                        fileType: fileCategory,
                        size: file.size,
                        sizeFormatted: FileUploadUtils.formatFileSize(file.size),
                        uploadedAt: new Date(),
                        userId: req.user.id
                    };

                    const savedFile = await File.create(fileData);

                    uploadedFiles.push({
                        id: savedFile._id,
                        filename: savedFile.filename,
                        uploadedFilename: savedFile.uploadedFilename,
                        fileUrl: savedFile.fileUrl,
                        mimeType: savedFile.mimeType,
                        fileType: savedFile.fileType,
                        size: savedFile.size,
                        sizeFormatted: savedFile.sizeFormatted,
                        uploadedAt: savedFile.uploadedAt
                    });
                } catch (err) {
                    console.error(`Error processing file ${file.originalname}:`, err);
                    continue;
                }
            }

            if (uploadedFiles.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files could be uploaded'
                });
            }

            return res.status(201).json({
                success: true,
                message: `${uploadedFiles.length} file(s) uploaded successfully`,
                data: uploadedFiles
            });
        } catch (error) {
            if (req.files) {
                for (const file of req.files) {
                    try {
                        await fs.unlink(file.path);
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                }
            }

            return res.status(500).json({
                success: false,
                message: 'Files upload failed',
                error: error.message
            });
        }
    }

    static async getFiles(req, res) {
        try {
            const files = await File.find({ userId: req.user.id }).sort({ uploadedAt: -1 });

            return res.status(200).json({
                success: true,
                data: files,
                count: files.length
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch files',
                error: error.message
            });
        }
    }

    static async getFilesByType(req, res) {
        try {
            const { fileType } = req.params;

            const validTypes = Object.keys(uploadConfig.fileCategories);
            if (!validTypes.includes(fileType)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid file type. Allowed types: ${validTypes.join(', ')}`
                });
            }

            const files = await File.find({
                userId: req.user.id,
                fileType: fileType
            }).sort({ uploadedAt: -1 });

            return res.status(200).json({
                success: true,
                data: files,
                count: files.length,
                fileType: fileType
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch files',
                error: error.message
            });
        }
    }

    static async deleteFile(req, res) {
        try {
            const { fileId } = req.params;

            const file = await File.findOne({
                _id: fileId,
                userId: req.user.id
            });

            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }

            const deleted = await FileUploadUtils.deleteFile(file.fileUrl);

            if (deleted) {
                await File.deleteOne({ _id: fileId });
            }

            return res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete file',
                error: error.message
            });
        }
    }

    static async deleteMultipleFiles(req, res) {
        try {
            const { fileIds } = req.body;

            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide file IDs'
                });
            }

            const files = await File.find({
                _id: { $in: fileIds },
                userId: req.user.id
            });

            if (files.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No files found'
                });
            }

            for (const file of files) {
                await FileUploadUtils.deleteFile(file.fileUrl);
            }

            await File.deleteMany({
                _id: { $in: fileIds },
                userId: req.user.id
            });

            return res.status(200).json({
                success: true,
                message: `${files.length} file(s) deleted successfully`
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete files',
                error: error.message
            });
        }
    }

    static async getFileStats(req, res) {
        try {
            const files = await File.find({ userId: req.user.id });

            const stats = {
                totalFiles: files.length,
                totalSize: files.reduce((sum, file) => sum + file.size, 0),
                totalSizeFormatted: FileUploadUtils.formatFileSize(
                    files.reduce((sum, file) => sum + file.size, 0)
                ),
                byType: {}
            };

            for (const category of Object.keys(uploadConfig.fileCategories)) {
                const categoryFiles = files.filter(f => f.fileType === category);
                stats.byType[category] = {
                    count: categoryFiles.length,
                    size: categoryFiles.reduce((sum, file) => sum + file.size, 0),
                    sizeFormatted: FileUploadUtils.formatFileSize(
                        categoryFiles.reduce((sum, file) => sum + file.size, 0)
                    )
                };
            }

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to get file statistics',
                error: error.message
            });
        }
    }
}

module.exports = FileUpload;