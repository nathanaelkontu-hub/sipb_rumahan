    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const path = require('path');
    const pelangganController = require('../controllers/pelangganController');
    const { verifyToken } = require('../middleware/auth');

    // Setup multer untuk upload file
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueName + path.extname(file.originalname));
        }
    });

    const upload = multer({ 
        storage,
        limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
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

    // Semua route pelanggan wajib login
    router.use(verifyToken);

    // Barang
    router.get('/barang', pelangganController.getBarang);

    // Pesanan
    router.get('/pesanan', pelangganController.getPesananSaya);
    router.post('/pesanan', pelangganController.buatPesananCustom);

    // Riwayat
    router.get('/riwayat', pelangganController.getRiwayat);

    // Chat
    router.get('/chat/:id_pesanan', pelangganController.getChat);
    router.post('/chat', upload.single('gambar'), pelangganController.kirimChat);

    // Pembayaran
    router.post('/pembayaran', upload.single('bukti_bayar'), pelangganController.uploadBuktiPembayaran);


    module.exports = router;