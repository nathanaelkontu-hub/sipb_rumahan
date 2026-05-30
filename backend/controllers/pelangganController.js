const db = require('../config/database');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

exports.getPesananSaya = async (req, res) => {
    try {
        const id_pelanggan = req.user.id_pelanggan || req.user.id;

        const [pesanan] = await db.execute(
            `SELECT 
                p.id_pesanan,
                p.kode_pesanan,
                p.id_pelanggan,
                p.tanggal_pesan,
                p.total_harga,
                p.status,
                p.catatan,
                GROUP_CONCAT(b.nama_barang SEPARATOR ', ') AS nama_barang,
                GROUP_CONCAT(b.kategori_barang SEPARATOR ', ') AS kategori_barang,
                GROUP_CONCAT(b.sub_kategori_barang SEPARATOR ', ') AS sub_kategori_barang
             FROM pesanan p
             LEFT JOIN detail_pesanan dp ON p.id_pesanan = dp.id_pesanan
             LEFT JOIN barang b ON dp.id_barang = b.id_barang
             WHERE p.id_pelanggan = ?
             GROUP BY 
                p.id_pesanan,
                p.kode_pesanan,
                p.id_pelanggan,
                p.tanggal_pesan,
                p.total_harga,
                p.status,
                p.catatan
             ORDER BY p.tanggal_pesan DESC`,
            [id_pelanggan]
        );

        res.json({
            success: true,
            data: pesanan
        });

    } catch (error) {
        console.error('ERROR GET PESANAN SAYA:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.buatPesanan = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { id_barang, jumlah, catatan } = req.body;
        const id_pelanggan = req.user.id_pelanggan;

        let sanitizedCatatan = catatan ? String(catatan).trim() : "";
        if (sanitizedCatatan.length < 10 || sanitizedCatatan.length > 1000) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: "Deskripsi pesanan wajib diisi dan harus antara 10 hingga 1000 karakter"
            });
        }
        if (/(.)\1{9,}/i.test(sanitizedCatatan)) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: "Deskripsi pesanan tidak valid: terdeteksi pengulangan karakter yang berlebihan"
            });
        }
        sanitizedCatatan = DOMPurify.sanitize(sanitizedCatatan);

        const [barang] = await conn.execute(
            'SELECT * FROM barang WHERE id_barang = ? AND status = "tersedia"',
            [id_barang]
        );

        if (barang.length === 0) {
            await conn.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Barang tidak ditemukan' 
            });
        }

        const harga_satuan = barang[0].harga_dasar;
        const subtotal = harga_satuan * jumlah;

        const [lastPesanan] = await conn.execute(
            'SELECT id_pesanan FROM pesanan ORDER BY id_pesanan DESC LIMIT 1'
        );
        const nextId = lastPesanan.length > 0 ? lastPesanan[0].id_pesanan + 1 : 1;
        const tahun = new Date().getFullYear();
        const kode_pesanan = `ORD-${tahun}-${String(nextId).padStart(4, '0')}`;

        const [result] = await conn.execute(
            `INSERT INTO pesanan 
             (kode_pesanan, id_pelanggan, total_harga, status, catatan)
             VALUES (?, ?, ?, 'pending', ?)`,
            [kode_pesanan, id_pelanggan, subtotal, sanitizedCatatan || null]
        );

        const id_pesanan = result.insertId;

        await conn.execute(
            `INSERT INTO detail_pesanan 
             (id_pesanan, id_barang, jumlah, harga_satuan, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [id_pesanan, id_barang, jumlah, harga_satuan, subtotal]
        );

        await conn.commit();

        res.status(201).json({
            success: true,
            message: 'Pesanan berhasil dibuat',
            data: { id_pesanan, kode_pesanan }
        });

    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        conn.release();
    }
};

exports.getRiwayat = async (req, res) => {
    try {
        const id_pelanggan = req.user.id_pelanggan || req.user.id || null;

        console.log('USER TOKEN RIWAYAT:', req.user);
        console.log('ID PELANGGAN RIWAYAT:', id_pelanggan);

        if (!id_pelanggan) {
            return res.status(400).json({
                success: false,
                message: 'ID pelanggan tidak ditemukan. Silakan login ulang.'
            });
        }

        const [riwayat] = await db.execute(
            `SELECT 
                p.id_pesanan,
                p.kode_pesanan,
                p.id_pelanggan,
                p.tanggal_pesan,
                p.total_harga,
                p.status,
                p.catatan,
                p.catatan_admin,
                py.metode,
                py.status as status_bayar,
                py.jumlah_bayar,
                GROUP_CONCAT(b.nama_barang SEPARATOR ', ') AS nama_barang,
                GROUP_CONCAT(b.kategori_barang SEPARATOR ', ') AS kategori_barang,
                GROUP_CONCAT(b.sub_kategori_barang SEPARATOR ', ') AS sub_kategori_barang
             FROM pesanan p
             LEFT JOIN pembayaran py ON py.id_pembayaran = (
                SELECT MAX(id_pembayaran) FROM pembayaran WHERE id_pesanan = p.id_pesanan
             )
             LEFT JOIN detail_pesanan dp ON p.id_pesanan = dp.id_pesanan
             LEFT JOIN barang b ON dp.id_barang = b.id_barang
             WHERE p.id_pelanggan = ?
             GROUP BY 
                p.id_pesanan,
                p.kode_pesanan,
                p.id_pelanggan,
                p.tanggal_pesan,
                p.total_harga,
                p.status,
                p.catatan,
                p.catatan_admin,
                py.metode,
                py.status,
                py.jumlah_bayar
             ORDER BY p.tanggal_pesan DESC`,
            [id_pelanggan]
        );

        console.log('JUMLAH RIWAYAT:', riwayat.length);

        res.json({ 
            success: true, 
            data: riwayat 
        });

    } catch (error) {
        console.error('ERROR GET RIWAYAT:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.getBarang = async (req, res) => {
    try {
        const [barang] = await db.execute(
            'SELECT * FROM barang WHERE status = "tersedia" ORDER BY nama_barang'
        );
        res.json({ success: true, data: barang });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getChat = async (req, res) => {
    try {
        const { id_pesanan } = req.params;
        const id_pelanggan = req.user.id_pelanggan;

        const [cekPesanan] = await db.execute(
            'SELECT id_pesanan FROM pesanan WHERE id_pesanan = ? AND id_pelanggan = ?',
            [id_pesanan, id_pelanggan]
        );

        if (cekPesanan.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Akses ditolak' 
            });
        }

        const [chat] = await db.execute(
            `SELECT c.*, p.nama as nama_pengirim, p.role
             FROM chat c
             JOIN pelanggan p ON c.id_pengirim = p.id_pelanggan
             WHERE c.id_pesanan = ?
             ORDER BY c.waktu ASC`,
            [id_pesanan]
        );

        res.json({ success: true, data: chat });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.kirimChat = async (req, res) => {
    try {
        const { id_pesanan, pesan } = req.body;
        const id_pengirim = req.user.id_pelanggan || req.user.id;
        const gambar = req.file ? req.file.filename : null;

        await db.execute(
            'INSERT INTO chat (id_pesanan, id_pengirim, pesan, gambar) VALUES (?, ?, ?, ?)',
            [id_pesanan, id_pengirim, pesan || '', gambar]
        );

        res.json({ success: true, message: 'Pesan terkirim' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadBuktiPembayaran = async (req, res) => {
    try {
        const { id_pesanan, metode, jumlah_bayar } = req.body;
        const id_pelanggan = req.user.id_pelanggan;

        const [pesanan] = await db.execute(
            'SELECT * FROM pesanan WHERE id_pesanan = ? AND id_pelanggan = ?',
            [id_pesanan, id_pelanggan]
        );

        if (pesanan.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Pesanan tidak ditemukan' 
            });
        }

        const bukti_bayar = req.file ? req.file.filename : null;

        await db.execute(
            `INSERT INTO pembayaran 
             (id_pesanan, jumlah_bayar, metode, bukti_bayar, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [id_pesanan, jumlah_bayar, metode, bukti_bayar]
        );

        res.json({ 
            success: true, 
            message: 'Bukti pembayaran berhasil diupload' 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

function validasiNamaBarangDenganKategori(namaBarang, kategoriBarang) {
    const nama = String(namaBarang || "").toLowerCase().trim();

    const kategoriKeywords = {
        Elektronik: {
            keywords: [
                "hp",
                "handphone",
                "smartphone",
                "tv",
                "televisi",
                "speaker",
                "laptop",
                "komputer",
                "monitor",
                "charger",
                "kamera",
                "tablet",
                "samsung",
                "asus",
                "iphone",
                "xiaomi",
                "oppo",
                "vivo"
            ],
            contoh: "HP Samsung, TV LED, Speaker Bluetooth, Laptop Asus"
        },

        "Elektronik Rumah Tangga": {
            keywords: [
                "kulkas",
                "mesin cuci",
                "ac",
                "rice cooker",
                "kompor listrik",
                "blender",
                "kipas",
                "dispenser",
                "microwave",
                "oven",
                "setrika",
                "vacuum"
            ],
            contoh: "Kulkas 2 pintu, Mesin Cuci, AC, Blender"
        },

        "Perabot Rumah": {
            keywords: [
                "sofa",
                "lemari",
                "spring bed",
                "kasur",
                "meja",
                "kursi",
                "rak",
                "tempat tidur",
                "kabinet",
                "bufet",
                "pintu",
                "jendela"
            ],
            contoh: "Sofa, Lemari pakaian, Spring Bed, Meja makan"
        },

        Otomotif: {
            keywords: [
                "motor",
                "helm",
                "ban motor",
                "aki motor",
                "spion",
                "oli",
                "knalpot",
                "velg",
                "kampas rem",
                "rantai motor",
                "jaket motor"
            ],
            contoh: "Motor, Helm, Ban Motor, Aki Motor"
        },

        "Material Bangunan": {
            keywords: [
                "semen",
                "pasir",
                "batu",
                "bata",
                "keramik",
                "cat",
                "paku",
                "besi",
                "kayu",
                "triplek",
                "seng",
                "pipa",
                "bahan bangunan"
            ],
            contoh: "Semen, Pasir, Batu Bata, Cat Tembok, Keramik"
        },

        Perhiasan: {
            keywords: [
                "emas",
                "batang emas",
                "cincin",
                "kalung",
                "gelang",
                "anting",
                "berlian",
                "perak",
                "logam mulia"
            ],
            contoh: "Batang Emas, Cincin Emas, Kalung, Gelang"
        }
    };

    const dataKategori = kategoriKeywords[kategoriBarang];

    if (!dataKategori) {
        return {
            valid: false,
            message: "Kategori barang tidak valid"
        };
    }

    let skorKategoriDipilih = 0;

    dataKategori.keywords.forEach((keyword) => {
        if (nama.includes(keyword)) {
            skorKategoriDipilih += 2;
        }
    });

    const konflikKategori = [];

    Object.entries(kategoriKeywords).forEach(([kategori, data]) => {
        if (kategori === kategoriBarang) return;

        data.keywords.forEach((keyword) => {
            if (nama.includes(keyword)) {
                konflikKategori.push({
                    kategori,
                    keyword
                });
            }
        });
    });

    if (konflikKategori.length > 0 && skorKategoriDipilih === 0) {
        const konflik = konflikKategori[0];

        return {
            valid: false,
            message: `Nama barang lebih cocok ke kategori ${konflik.kategori}. Contoh untuk kategori ${kategoriBarang}: ${dataKategori.contoh}`
        };
    }

    if (konflikKategori.length > 0 && skorKategoriDipilih <= konflikKategori.length * 2) {
        const konflik = konflikKategori[0];

        return {
            valid: false,
            message: `Nama barang mengandung kata "${konflik.keyword}" yang lebih cocok untuk kategori ${konflik.kategori}. Contoh untuk kategori ${kategoriBarang}: ${dataKategori.contoh}`
        };
    }

    if (skorKategoriDipilih < 2) {
        return {
            valid: false,
            message: `Nama barang tidak sesuai dengan kategori ${kategoriBarang}. Contoh yang benar: ${dataKategori.contoh}`
        };
    }

    return {
        valid: true,
        message: ""
    };
}

// BUAT PESANAN CUSTOM (BARANG BEBAS DIKETIK)
exports.buatPesananCustom = async (req, res) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const id_pelanggan = req.user.id_pelanggan || req.user.id;
        const { items, harga_estimasi, catatan } = req.body;

        let sanitizedCatatan = catatan ? String(catatan).trim() : "";
        if (sanitizedCatatan.length < 10 || sanitizedCatatan.length > 1000) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: "Deskripsi pesanan wajib diisi dan harus antara 10 hingga 1000 karakter"
            });
        }
        if (/(.)\1{9,}/i.test(sanitizedCatatan)) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: "Deskripsi pesanan tidak valid: terdeteksi pengulangan karakter yang berlebihan"
            });
        }
        sanitizedCatatan = DOMPurify.sanitize(sanitizedCatatan);

        const [cekProfil] = await conn.execute(
    `SELECT alamat, kota, kecamatan, kelurahan, no_rumah 
     FROM pelanggan 
     WHERE id_pelanggan = ? 
     LIMIT 1`,
    [id_pelanggan]
);

if (cekProfil.length === 0) {
    await conn.rollback();
    return res.status(404).json({
        success: false,
        message: "Data pelanggan tidak ditemukan"
    });
}

const profil = cekProfil[0];

if (
    !profil.alamat ||
    !profil.kota ||
    !profil.kecamatan ||
    !profil.kelurahan ||
    !profil.no_rumah
) {
    await conn.rollback();
    return res.status(400).json({
        success: false,
        message: "Lengkapi alamat profil terlebih dahulu sebelum membuat pesanan"
    });
}

        if (!id_pelanggan) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: "ID pelanggan tidak ditemukan. Silakan login ulang."
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: "Minimal harus ada 1 barang dalam pesanan"
            });
        }

        const subKategoriValid = {
            "Elektronik": ["HP", "TV", "Speaker"],
            "Elektronik Rumah Tangga": ["Kulkas", "Mesin Cuci"],
            "Perabot Rumah": ["Sofa", "Lemari", "Spring Bed", "Meja Makan"],
            "Otomotif": ["Motor"],
            "Material Bangunan": [
                "Semen",
                "Pasir",
                "Kerikil",
                "Kayu",
                "Cat",
                "Triplek",
                "Besi",
                "Batu Bata",
                "Baja Ringan"
            ],
            "Perhiasan": ["Emas"]
        };

        for (const item of items) {
            if (
                !item.nama_barang ||
                !item.kategori_barang ||
                !item.sub_kategori_barang ||
                !item.jumlah
            ) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Nama barang, kategori, sub-kategori, dan jumlah wajib diisi"
                });
            }

            if (!subKategoriValid[item.kategori_barang]) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Kategori barang tidak valid"
                });
            }

            if (!subKategoriValid[item.kategori_barang].includes(item.sub_kategori_barang)) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Sub-kategori tidak sesuai dengan kategori barang"
                });
            }

            if (Number(item.jumlah) < 1) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Jumlah barang minimal 1"
                });
            }
        }

        const [lastPesanan] = await conn.execute(
            "SELECT id_pesanan FROM pesanan ORDER BY id_pesanan DESC LIMIT 1"
        );

        const nextId = lastPesanan.length > 0 ? lastPesanan[0].id_pesanan + 1 : 1;
        const tahun = new Date().getFullYear();
        const kode_pesanan = "ORD-" + tahun + "-" + String(nextId).padStart(4, "0");

        const [pesananResult] = await conn.execute(
            `INSERT INTO pesanan 
             (kode_pesanan, id_pelanggan, tanggal_pesan, total_harga, status, catatan)
             VALUES (?, ?, NOW(), ?, 'pending', ?)`,
            [
                kode_pesanan,
                id_pelanggan,
                Number(harga_estimasi || 0),
                sanitizedCatatan || null
            ]
        );

        const id_pesanan = pesananResult.insertId;

        for (const item of items) {
            const [barangResult] = await conn.execute(
              `INSERT INTO barang 
              (nama_barang, kategori_barang, sub_kategori_barang, harga_dasar, status)
              VALUES (?, ?, ?, ?, 'tersedia')`,[
              item.nama_barang.trim(),
              item.kategori_barang,
              item.sub_kategori_barang,
              0]
            );

            const id_barang = barangResult.insertId;

            await conn.execute(
                `INSERT INTO detail_pesanan
                 (id_pesanan, id_barang, jumlah, harga_satuan, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    id_pesanan,
                    id_barang,
                    Number(item.jumlah),
                    0,
                    0
                ]
            );
        }

        await conn.commit();

        res.status(201).json({
            success: true,
            message: "Pesanan berhasil dibuat",
            data: {
                id_pesanan,
                kode_pesanan
            }
        });

    } catch (error) {
        await conn.rollback();

        console.error("BUAT PESANAN CUSTOM ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Gagal membuat pesanan"
        });
    } finally {
        conn.release();
    }
};