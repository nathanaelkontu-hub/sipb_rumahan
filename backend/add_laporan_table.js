require('dotenv').config();
const mysql = require('mysql2/promise');

async function addLaporanTable() {
    console.log("Connecting to DB...");
    const connection = await mysql.createConnection({
        uri: process.env.AIVEN_DB_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Membuat tabel laporan_tersimpan...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS laporan_tersimpan (
                id_laporan INT AUTO_INCREMENT PRIMARY KEY,
                nama_laporan VARCHAR(255) NOT NULL,
                tipe VARCHAR(50) NOT NULL,
                tgl_mulai DATE NOT NULL,
                tgl_selesai DATE NOT NULL,
                total_pendapatan DECIMAL(15,2) DEFAULT 0,
                dibuat_oleh INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dibuat_oleh) REFERENCES pelanggan(id_pelanggan) ON DELETE CASCADE
            )
        `);
        console.log("✅ Tabel laporan_tersimpan berhasil dibuat!");
    } catch (err) {
        console.error("❌ Gagal membuat tabel:", err.message);
    } finally {
        await connection.end();
        process.exit(0);
    }
}

addLaporanTable();
