const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');
const path = require('path');

const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Setup multer untuk upload foto profil menggunakan Cloudinary
const storage = createCloudinaryStorage('profil');

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedExt = /jpeg|jpg|png/;
        const ext = allowedExt.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedExt.test(file.mimetype);

        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file JPG dan PNG yang diizinkan'));
        }
    }
});

// AUTH
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
// PROFILE
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.gantiPassword);

// UPLOAD FOTO PROFIL
router.post(
    '/profile/photo',
    verifyToken,
    upload.single('foto_profil'),
    authController.uploadFotoProfil
);

module.exports = router;