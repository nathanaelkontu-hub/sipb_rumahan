const mysql = require('mysql2/promise');
require('dotenv').config();

const aivenUrl = process.env.AIVEN_DB_URL ? process.env.AIVEN_DB_URL.split('?')[0] : null;

const poolConfig = aivenUrl ? {
    uri: aivenUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
} : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'sipb_rumahan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(poolConfig);

// Test koneksi
pool.getConnection()
    .then(conn => {
        console.log('✅ Database terhubung!');
        conn.release();
    })
    .catch(err => {
        console.log('❌ Database gagal terhubung:', err.message);
    });

module.exports = pool;