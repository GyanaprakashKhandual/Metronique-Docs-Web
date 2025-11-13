const path = require('path');
const fs = require('fs').promises;
const uploadConfig = require('../configs/upload.config');

class FileUploadUtils {
    static getFileCategory(extension) {
        const ext = extension.toLowerCase();

        for (const [category, extensions] of Object.entries(uploadConfig.fileCategories)) {
            if (extensions.includes(ext)) {
                return category;
            }
        }

        return 'document';
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    static getFileExtension(filename) {
        return path.extname(filename).slice(1).toLowerCase();
    }

    static validateFileSize(size) {
        return size <= uploadConfig.maxFileSize;
    }

    static validateFileType(mimeType) {
        return uploadConfig.allowedMimeTypes.includes(mimeType);
    }

    static async deleteFile(filePath) {
        try {
            const fullPath = path.join(uploadConfig.uploadFolder, path.basename(filePath));
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    static buildFileUrl(filename) {
        return `${uploadConfig.baseUrl}${uploadConfig.uploadPath}/${filename}`;
    }

    static parseFilePath(fileUrl) {
        return path.basename(fileUrl);
    }
}

module.exports = FileUploadUtils;