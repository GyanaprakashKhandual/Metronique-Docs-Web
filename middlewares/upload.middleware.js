const uploadConfig = require('../configs/upload.config');
const FileUploadUtils = require('../utils/file.upload.util');

const validateUploadMiddleware = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const files = req.files || [req.file];

  for (const file of files) {
    if (!FileUploadUtils.validateFileSize(file.size)) {
      return res.status(413).json({
        success: false,
        message: `File size exceeds maximum limit of ${uploadConfig.maxFileSizeMB}MB`
      });
    }

    if (!FileUploadUtils.validateFileType(file.mimetype)) {
      return res.status(415).json({
        success: false,
        message: `File type not allowed. Allowed types: ${uploadConfig.allowedExtensions.join(', ')}`
      });
    }
  }

  next();
};

module.exports = { validateUploadMiddleware };