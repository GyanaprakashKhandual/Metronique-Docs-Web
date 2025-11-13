const express = require('express');
const upload = require('../configs/multer.config');
const { protect, } = require('../middlewares/auth.middleware');
const { validateUploadMiddleware } = require('../middlewares/upload.middleware');
const FileUploadController = require('../controllers/file.upload.controller');

const router = express.Router();

router.post(
    '/upload',
    protect,
    upload.single('file'),
    validateUploadMiddleware,
    FileUploadController.uploadSingleFile
);

router.post(
    '/upload-multiple',
    protect,
    upload.array('files', 10),
    validateUploadMiddleware,
    FileUploadController.uploadMultipleFiles
);

router.get(
    '/files',
    protect,
    FileUploadController.getFiles
);

router.get(
    '/files/type/:fileType',
    protect,
    FileUploadController.getFilesByType
);

router.delete(
    '/delete/:fileId',
    protect,
    FileUploadController.deleteFile
);

router.post(
    '/delete-multiple',
    protect,
    FileUploadController.deleteMultipleFiles
);

router.get(
    '/stats',
    protect,
    FileUploadController.getFileStats
);

module.exports = router;