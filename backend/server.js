const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files untuk uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/pelanggan', require('./routes/pelanggan'));

// Route default
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'SIPB API Server berjalan!',
        version: '1.0.0'
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route tidak ditemukan' 
    });
});

// Handle error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Terjadi kesalahan server' 
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('================================');
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}`);
    console.log('================================');
});