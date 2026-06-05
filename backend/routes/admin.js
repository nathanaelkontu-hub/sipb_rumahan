const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');
const path = require('path');

// Setup multer untuk upload file menggunakan Cloudinary
const storage = createCloudinaryStorage('admin_chat');

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for admin
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        if (ext) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan'));
        }
    }
});

// Semua route admin wajib login dan role admin
router.use(verifyToken, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Pesanan
router.get('/pesanan', adminController.getPesanan);
router.get('/pesanan/:id', adminController.getDetailPesanan);
router.put('/pesanan/:id/status', adminController.updateStatusPesanan);

// Pelanggan
router.get('/pelanggan', adminController.getPelanggan);
router.put('/pelanggan/:id/status', adminController.updateStatusPelanggan);

// Laporan
router.get('/laporan', adminController.getLaporan);
router.get('/laporan/excel', adminController.generateExcelLaporan);

// User
router.get('/users', adminController.getAllUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Chat / Koordinasi
router.get('/chat/:id_pesanan', adminController.getChat);
router.post('/chat', upload.single('gambar'), adminController.kirimChat);

// Barang
router.get('/barang', adminController.getBarang);

module.exports = router;