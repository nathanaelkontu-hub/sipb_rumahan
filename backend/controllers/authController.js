const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { isLokasiValid } = require("../data/lokasiSulut");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function buatToken(user) {
    return jwt.sign(
        {
            id: user.id_pelanggan,
            id_pelanggan: user.id_pelanggan,
            nama: user.nama,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );
}

function hapusPassword(user) {
    const { password, ...userData } = user;
    return userData;
}

function validasiNamaTambahan(nama) {
    const value = nama.trim().toLowerCase();

    const blacklist = [
        "admin palsu",
        "test",
        "testing",
        "dummy",
        "fake",
        "asdf",
        "qwerty",
        "anjing",
        "bangsat",
        "kontol",
        "memek",
        "babi",
        "goblok",
        "tolol"
    ];

    if (blacklist.some((kata) => value.includes(kata))) {
        return "Nama mengandung kata yang tidak diperbolehkan";
    }

    if (/(.)\1{3,}/.test(value)) {
        return "Nama tidak boleh memiliki huruf yang sama lebih dari 3 kali berturut-turut";
    }

    const polaKeyboard = [
        "asdf",
        "asdfg",
        "asdfgh",
        "asdfghj",
        "qwer",
        "qwert",
        "qwerty",
        "zxcv",
        "zxcvb"
    ];

    if (polaKeyboard.some((pola) => value.includes(pola))) {
        return "Nama tidak boleh memakai pola huruf acak";
    }

    const hanyaKonsonanPanjang = /^[bcdfghjklmnpqrstvwxyz]{6,}$/i;

    if (hanyaKonsonanPanjang.test(value.replace(/\s/g, ""))) {
        return "Nama terlihat tidak valid";
    }

    return null;
}

function validasiEmailTambahan(email) {
    const value = email.trim().toLowerCase();

    const disposableDomains = [
        "mailinator.com",
        "10minutemail.com",
        "guerrillamail.com",
        "yopmail.com",
        "tempmail.com",
        "trashmail.com",
        "fakeinbox.com",
        "sharklasers.com"
    ];

    const domain = value.split("@")[1];

    if (disposableDomains.includes(domain)) {
        return "Domain email sementara atau palsu tidak diperbolehkan";
    }

    const username = value.split("@")[0];

    if (/(.)\1{3,}/.test(username)) {
        return "Email terlihat seperti spam atau tidak valid";
    }

    const polaKeyboard = [
        "asdf",
        "asdfg",
        "asdfgh",
        "asdfghj",
        "qwer",
        "qwert",
        "qwerty",
        "zxcv",
        "zxcvb"
    ];

    if (polaKeyboard.some((pola) => username.includes(pola))) {
        return "Email terlihat tidak valid";
    }

    const hanyaKonsonanPanjang = /^[bcdfghjklmnpqrstvwxyz]{6,}$/i;

    if (hanyaKonsonanPanjang.test(username.replace(/\./g, ""))) {
        return "Email terlihat seperti spam";
    }

    return null;
}

function validasiTeleponTambahan(telepon) {
    const value = telepon.trim();

    if (!/^08\d{8,11}$|^\+?62\d{9,12}$/.test(value)) {
        return "Nomor HP harus format Indonesia. Contoh: 081234567890 atau +6281234567890";
    }

    let nomorLokal = value;

    if (value.startsWith("+62")) {
        nomorLokal = "0" + value.slice(3);
    } else if (value.startsWith("62")) {
        nomorLokal = "0" + value.slice(2);
    }

    const prefix4Digit = nomorLokal.slice(0, 4);

    const prefixOperatorValid = [
        "0811", "0812", "0813", "0821", "0822", "0823", "0852", "0853", "0851",
        "0817", "0818", "0819", "0859", "0877", "0878",
        "0855", "0856", "0857", "0858", "0814", "0815", "0816",
        "0831", "0832", "0833", "0838",
        "0895", "0896", "0897", "0898", "0899",
        "0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"
    ];

    if (!prefixOperatorValid.includes(prefix4Digit)) {
        return "Prefix nomor HP tidak valid. Contoh prefix valid: 0812, 0856, 0896";
    }

    if (/^(\+?62|08)(\d)\2{7,}$/.test(value)) {
        return "Nomor HP tidak boleh berisi angka berulang berlebihan";
    }

    return null;
}

function validasiNamaJalanProfil(alamat) {
    const value = alamat.trim();
    const lowerValue = value.toLowerCase();

    const alamatRegex = /^[a-zA-Z0-9\s.,\/-]{15,100}$/;

    if (!alamatRegex.test(value)) {
        return "Nama jalan harus 15 sampai 100 karakter dan hanya boleh berisi huruf, angka, spasi, titik, koma, /, dan -";
    }

    const prefixValid = [
        "jl.",
        "jalan",
        "gang",
        "gg.",
        "komplek",
        "perumahan",
        "perum",
        "pertigaan",
        "perempatan",
        "lorong",
        "blok",
        "rt"
    ];

    const memakaiPrefix = prefixValid.some((prefix) => lowerValue.startsWith(prefix));

    if (!memakaiPrefix) {
        return "Nama jalan harus diawali kata seperti Jl., Jalan, Gang, Gg., Komplek, Perumahan, Pertigaan, atau Perempatan. Contoh: Jl. Merdeka No. 104";
    }

    if (!/\d/.test(value)) {
        return "Nama jalan harus mengandung angka, misalnya nomor rumah, nomor blok, atau RT/RW. Contoh: Jl. Merdeka No. 104";
    }

    if (/(.)\1{3,}/.test(value)) {
        return "Nama jalan tidak boleh memiliki karakter yang sama lebih dari 3 kali berturut-turut";
    }

    const kata = lowerValue.split(/\s+/).filter(Boolean);

    for (let i = 0; i < kata.length - 2; i++) {
        if (kata[i] === kata[i + 1] && kata[i] === kata[i + 2]) {
            return "Nama jalan tidak boleh memiliki kata yang diulang berlebihan";
        }
    }

    return null;
}

function validasiKotaProfil(kota) {
    const value = kota.trim();

    const kotaRegex = /^[a-zA-Z\s]{4,30}$/;

    if (!kotaRegex.test(value)) {
        return "Kota harus 4 sampai 30 karakter dan hanya boleh berisi huruf serta spasi";
    }

    if (/(.)\1{3,}/.test(value.toLowerCase())) {
        return "Kota tidak boleh memiliki huruf yang sama lebih dari 3 kali berturut-turut";
    }

    return null;
}

function validasiNoRumahProfil(noRumah) {
    const value = noRumah.trim();

    const noRumahRegex = /^[a-zA-Z0-9\s.\/-]{1,15}$/;

    if (!noRumahRegex.test(value)) {
        return "No rumah harus 1 sampai 15 karakter dan hanya boleh berisi huruf, angka, spasi, titik, /, dan -";
    }

    if (!/[a-zA-Z0-9]/.test(value)) {
        return "No rumah harus mengandung angka atau huruf. Contoh: 7, C, 12-A, atau Blok C/7";
    }

    return null;
}

function validasiWilayahProfil(label, value) {
    const teks = value.trim();

    const wilayahRegex = /^[a-zA-Z\s.'-]{3,50}$/;

    if (!wilayahRegex.test(teks)) {
        return `${label} harus 3 sampai 50 karakter dan hanya boleh berisi huruf, spasi, titik, petik, dan -`;
    }

    if (/(.)\1{3,}/.test(teks.toLowerCase())) {
        return `${label} tidak boleh memiliki huruf yang sama lebih dari 3 kali berturut-turut`;
    }

    return null;
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailTrim = email ? email.trim().toLowerCase() : "";

        if (!emailTrim || !password) {
            return res.status(400).json({
                success: false,
                message: "Email dan password wajib diisi"
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM pelanggan WHERE email = ? LIMIT 1",
            [emailTrim]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Email tidak ditemukan"
            });
        }

        const user = rows[0];

        if (user.status === "ban") {
            return res.status(403).json({
                success: false,
                message: "Akun Anda telah diblokir. Hubungi admin."
            });
        }

        if (user.status === "nonaktif") {
            return res.status(403).json({
                success: false,
                message: "Akun Anda tidak aktif. Hubungi admin."
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "Akun ini dibuat dengan Google. Silakan login menggunakan Google."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password salah"
            });
        }

        const token = buatToken(user);

        res.json({
            success: true,
            message: "Login berhasil",
            token,
            user: hapusPassword(user)
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
};

exports.register = async (req, res) => {
    try {
        const {
            nama,
            email,
            password,
            konfirmasi_password,
            telepon,
            role,
            kode_admin
        } = req.body;

        const namaRegex = /^[a-zA-Z\s.'-]{3,100}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const teleponRegex = /^08\d{8,11}$|^\+?62\d{9,12}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

        const namaTrim = nama ? nama.trim() : "";
        const emailTrim = email ? email.trim().toLowerCase() : "";
        const teleponTrim = telepon ? telepon.trim() : "";
        const kodeAdminTrim = kode_admin ? kode_admin.trim() : "";
        const roleTrim = role ? role.trim() : "pelanggan";

        if (!namaTrim || !emailTrim || !password || !konfirmasi_password) {
            return res.status(400).json({
                success: false,
                message: "Nama, email, password, dan konfirmasi password wajib diisi"
            });
        }

        if (!namaRegex.test(namaTrim)) {
            return res.status(400).json({
                success: false,
                message: "Nama minimal 3 karakter dan hanya boleh berisi huruf"
            });
        }

        const pesanNama = validasiNamaTambahan(namaTrim);

        if (pesanNama) {
            return res.status(400).json({
                success: false,
                message: pesanNama
            });
        }

        if (!emailRegex.test(emailTrim)) {
            return res.status(400).json({
                success: false,
                message: "Format email tidak valid"
            });
        }

        const pesanEmail = validasiEmailTambahan(emailTrim);

        if (pesanEmail) {
            return res.status(400).json({
                success: false,
                message: pesanEmail
            });
        }

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password minimal 8 karakter, maksimal 64 karakter, harus berisi huruf besar, huruf kecil, dan angka"
            });
        }

        if (password !== konfirmasi_password) {
            return res.status(400).json({
                success: false,
                message: "Konfirmasi password tidak sama"
            });
        }

        if (!teleponRegex.test(teleponTrim)) {
            return res.status(400).json({
                success: false,
                message: "Nomor HP harus format Indonesia. Contoh: 081234567890 atau +6281234567890"
            });
        }

        const pesanTelepon = validasiTeleponTambahan(teleponTrim);

        if (pesanTelepon) {
            return res.status(400).json({
                success: false,
                message: pesanTelepon
            });
        }

        if (!["pelanggan", "admin"].includes(roleTrim)) {
            return res.status(400).json({
                success: false,
                message: "Role tidak valid"
            });
        }

        if (roleTrim === "admin") {
            if (!kodeAdminTrim || kodeAdminTrim !== process.env.ADMIN_REGISTER_CODE) {
                return res.status(403).json({
                    success: false,
                    message: "Kode admin tidak valid"
                });
            }
        }

        const [existing] = await db.execute(
            "SELECT id_pelanggan FROM pelanggan WHERE email = ? LIMIT 1",
            [emailTrim]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email sudah terdaftar"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO pelanggan
             (nama, email, password, telepon, role, status, provider)
             VALUES (?, ?, ?, ?, ?, 'aktif', 'local')`,
            [
                namaTrim,
                emailTrim,
                hashedPassword,
                teleponTrim,
                roleTrim
            ]
        );

        res.status(201).json({
            success: true,
            message: "Akun berhasil dibuat",
            id: result.insertId
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Terjadi kesalahan server"
        });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Credential Google tidak ditemukan"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const nama = payload.name || "Pelanggan";
        const email = payload.email ? payload.email.toLowerCase() : "";

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email Google tidak ditemukan"
            });
        }

        let [rows] = await db.execute(
            "SELECT * FROM pelanggan WHERE email = ? LIMIT 1",
            [email]
        );

        let user;

        if (rows.length === 0) {
            const [result] = await db.execute(
                `INSERT INTO pelanggan
                 (nama, email, password, google_id, role, status, provider)
                 VALUES (?, ?, NULL, ?, 'pelanggan', 'aktif', 'google')`,
                [nama, email, googleId]
            );

            const [newUser] = await db.execute(
                "SELECT * FROM pelanggan WHERE id_pelanggan = ? LIMIT 1",
                [result.insertId]
            );

            user = newUser[0];
        } else {
            user = rows[0];

            if (user.status === "ban" || user.status === "nonaktif") {
                return res.status(403).json({
                    success: false,
                    message: "Akun tidak aktif"
                });
            }

            if (!user.google_id) {
                await db.execute(
                    "UPDATE pelanggan SET google_id = ?, provider = ?, updated_at = NOW() WHERE id_pelanggan = ?",
                    [googleId, "google", user.id_pelanggan]
                );

                user.google_id = googleId;
                user.provider = "google";
            }
        }

        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Login Google hanya tersedia untuk pelanggan"
            });
        }

        const token = buatToken(user);

        res.json({
            success: true,
            message: "Login Google berhasil",
            token,
            user: hapusPassword(user)
        });

    } catch (error) {
        console.error("Google login error:", error);

        res.status(500).json({
            success: false,
            message: "Login Google gagal"
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const id = req.user.id_pelanggan || req.user.id;

        const [rows] = await db.execute(
            `SELECT 
                id_pelanggan,
                nama,
                email,
                telepon,
                alamat,
                kota,
                kecamatan,
                kelurahan,
                no_rumah,
                role,
                status,
                provider,
                foto_profil,
                created_at
             FROM pelanggan
             WHERE id_pelanggan = ?
             LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Profil tidak ditemukan"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const {
            nama,
            telepon,
            alamat,
            kota,
            kecamatan,
            kelurahan,
            no_rumah
        } = req.body;

        const id = req.user.id_pelanggan || req.user.id;

        const namaRegex = /^[a-zA-Z\s.'-]{3,100}$/;

        const namaTrim = nama ? nama.trim() : "";
        const teleponTrim = telepon ? telepon.trim() : "";
        const alamatTrim = alamat ? alamat.trim() : "";
        const kotaTrim = kota ? kota.trim() : "";
        const kecamatanTrim = kecamatan ? kecamatan.trim() : "";
        const kelurahanTrim = kelurahan ? kelurahan.trim() : "";
        const noRumahTrim = no_rumah ? no_rumah.trim() : "";

        if (!namaRegex.test(namaTrim)) {
            return res.status(400).json({
                success: false,
                message: "Nama minimal 3 karakter dan hanya boleh berisi huruf"
            });
        }

        const pesanNama = validasiNamaTambahan(namaTrim);

        if (pesanNama) {
            return res.status(400).json({
                success: false,
                message: pesanNama
            });
        }

        const pesanTelepon = validasiTeleponTambahan(teleponTrim);

        if (pesanTelepon) {
            return res.status(400).json({
                success: false,
                message: pesanTelepon
            });
        }

        if (req.user.role !== 'admin') {
            if (!alamatTrim) {
                return res.status(400).json({
                    success: false,
                    message: "Nama jalan wajib diisi"
                });
            }

            const pesanNamaJalan = validasiNamaJalanProfil(alamatTrim);

            if (pesanNamaJalan) {
                return res.status(400).json({
                    success: false,
                    message: pesanNamaJalan
                });
            }

            if (!kotaTrim) {
                return res.status(400).json({
                    success: false,
                    message: "Kota/Kabupaten wajib dipilih"
                });
            }

            if (!kecamatanTrim) {
                return res.status(400).json({
                    success: false,
                    message: "Kecamatan wajib dipilih"
                });
            }

            if (!kelurahanTrim) {
                return res.status(400).json({
                    success: false,
                    message: "Kelurahan wajib dipilih"
                });
            }

            if (!isLokasiValid(kotaTrim, kecamatanTrim, kelurahanTrim)) {
                return res.status(400).json({
                    success: false,
                    message: "Kombinasi Kota/Kabupaten, Kecamatan, dan Kelurahan tidak valid"
                });
            }

            if (!noRumahTrim) {
                return res.status(400).json({
                    success: false,
                    message: "No rumah wajib diisi"
                });
            }

            const pesanNoRumah = validasiNoRumahProfil(noRumahTrim);

            if (pesanNoRumah) {
                return res.status(400).json({
                    success: false,
                    message: pesanNoRumah
                });
            }
        }

        await db.execute(
            `UPDATE pelanggan 
             SET 
                nama = ?,
                telepon = ?,
                alamat = ?,
                kota = ?,
                kecamatan = ?,
                kelurahan = ?,
                no_rumah = ?,
                updated_at = NOW()
             WHERE id_pelanggan = ?`,
            [
                namaTrim,
                teleponTrim,
                alamatTrim,
                kotaTrim,
                kecamatanTrim,
                kelurahanTrim,
                noRumahTrim,
                id
            ]
        );

        const [updatedRows] = await db.execute(
            `SELECT 
                id_pelanggan,
                nama,
                email,
                telepon,
                alamat,
                kota,
                kecamatan,
                kelurahan,
                no_rumah,
                role,
                status,
                provider,
                foto_profil,
                created_at
             FROM pelanggan
             WHERE id_pelanggan = ?
             LIMIT 1`,
            [id]
        );

        res.json({
            success: true,
            message: "Profil berhasil diperbarui",
            user: updatedRows[0]
        });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Terjadi kesalahan server"
        });
    }
};

exports.gantiPassword = async (req, res) => {
    try {
        const { password_lama, password_baru } = req.body;
        const id_pelanggan = req.user.id_pelanggan || req.user.id;

        if (!id_pelanggan) {
            return res.status(400).json({
                success: false,
                message: "ID pelanggan tidak ditemukan. Silakan login ulang."
            });
        }

        if (!password_lama || !password_baru) {
            return res.status(400).json({
                success: false,
                message: "Password lama dan password baru wajib diisi"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

        if (!passwordRegex.test(password_baru)) {
            return res.status(400).json({
                success: false,
                message: "Password baru minimal 8 karakter, maksimal 64 karakter, harus berisi huruf besar, huruf kecil, dan angka"
            });
        }

        if (password_lama === password_baru) {
            return res.status(400).json({
                success: false,
                message: "Password baru tidak boleh sama dengan password lama"
            });
        }

        const [rows] = await db.execute(
            "SELECT id_pelanggan, password FROM pelanggan WHERE id_pelanggan = ? LIMIT 1",
            [id_pelanggan]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Data pelanggan tidak ditemukan"
            });
        }

        if (!rows[0].password) {
            return res.status(400).json({
                success: false,
                message: "Akun Google tidak memiliki password lokal"
            });
        }

        const isMatch = await bcrypt.compare(password_lama, rows[0].password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Password lama salah"
            });
        }

        const hashedPasswordBaru = await bcrypt.hash(password_baru, 10);

        await db.execute(
            "UPDATE pelanggan SET password = ?, updated_at = NOW() WHERE id_pelanggan = ?",
            [hashedPasswordBaru, id_pelanggan]
        );

        res.json({
            success: true,
            message: "Password berhasil diubah"
        });

    } catch (error) {
        console.error("GANTI PASSWORD ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Terjadi kesalahan server"
        });
    }
};

exports.uploadFotoProfil = async (req, res) => {
    try {
        const id_pelanggan = req.user.id_pelanggan || req.user.id;

        if (!id_pelanggan) {
            return res.status(400).json({
                success: false,
                message: "ID pelanggan tidak ditemukan. Silakan login ulang."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Foto profil wajib diupload"
            });
        }

        const foto_profil = req.file.filename;

        await db.execute(
            "UPDATE pelanggan SET foto_profil = ?, updated_at = NOW() WHERE id_pelanggan = ?",
            [foto_profil, id_pelanggan]
        );

        res.json({
            success: true,
            message: "Foto profil berhasil diperbarui",
            foto_profil,
            foto_url: `http://localhost:3000/uploads/${foto_profil}`
        });

    } catch (error) {
        console.error("Upload foto profil error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Gagal upload foto profil"
        });
    }
};