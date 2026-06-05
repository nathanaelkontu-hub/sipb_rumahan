const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware cek token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        console.log("verifyToken: authHeader =", authHeader);
        
        if (!authHeader) {
            console.log("verifyToken: Token tidak ditemukan");
            return res.status(401).json({ 
                success: false, 
                message: 'Token tidak ditemukan' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log("verifyToken: Format token salah");
            return res.status(401).json({ 
                success: false, 
                message: 'Format token salah' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("verifyToken: decoded =", decoded);
        
        const [rows] = await db.execute(
            "SELECT * FROM pelanggan WHERE id_pelanggan = ? AND status = 'aktif'",
            [decoded.id]
        );

        if (rows.length === 0) {
            console.log("verifyToken: Akun tidak aktif atau tidak ditemukan");
            return res.status(403).json({ 
                success: false, 
                message: 'Akun tidak aktif atau tidak ditemukan' 
            });
        }

        req.user = decoded;
        next();

    } catch (error) {
        console.log("verifyToken: Token tidak valid, error =", error);
        return res.status(401).json({ 
            success: false, 
            message: 'Token tidak valid',
            detail: error.message
        });
    }
};

// Middleware cek admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses ditolak. Hanya admin yang bisa mengakses.' 
        });
    }
    next();
};

// Middleware cek pelanggan
const isPelanggan = (req, res, next) => {
    if (req.user.role !== 'pelanggan') {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses ditolak.' 
        });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isPelanggan };