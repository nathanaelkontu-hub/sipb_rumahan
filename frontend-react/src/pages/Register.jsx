import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import API from "../api/api";

// Komponen utama untuk halaman Registrasi
function Register() {
  // Hook untuk navigasi antar halaman
  const navigate = useNavigate();
  // State untuk mengatur visibilitas password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State untuk menyimpan data input dari form registrasi
  const [form, setForm] = useState({
  nama: "",
  email: "",
  password: "",
  konfirmasi_password: "",
  telepon: "",
  role: "pelanggan",
  kode_admin: "",
});

  // State untuk pesan error, sukses, dan status loading
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Fungsi untuk menangani perubahan pada input form
  function handleChange(e) {
    setForm({
      ...form, // Menyalin nilai form sebelumnya
      [e.target.name]: e.target.value, // Memperbarui kolom yang sedang diketik
    });
  }

  // Fungsi untuk mengecek validitas nama (mencegah kata kasar, acak, atau pola palsu)
  function namaTidakValid(nama) {
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

  const hurufKembarBerulang = /(.)\1{3,}/;

if (hurufKembarBerulang.test(value)) {
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

// Fungsi untuk mengecek validitas email (mencegah domain sementara/buangan)
function emailTidakValid(email) {
  const value = email.trim().toLowerCase();

  const allowedDomains = [
    "gmail.com",
    "yahoo.com",
    "yahoo.co.id",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "belajar.id"
  ];

  const domain = value.split("@")[1];

  if (!allowedDomains.includes(domain)) {
    return "Gunakan email dari layanan yang valid (seperti gmail.com, yahoo.com, dll)";
  }

  const username = value.split("@")[0];

  const hurufKembarBerulang = /(.)\1{3,}/;

  if (hurufKembarBerulang.test(username)) {
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

// Fungsi untuk mengecek validitas nomor telepon (wajib format Indonesia)
function teleponTidakValid(telepon) {
  const value = telepon.trim();

  if (!/^(\+?62|08)/.test(value)) {
    return "Nomor HP harus diawali 08, 62, atau +62";
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

  // Fungsi utama untuk memvalidasi seluruh field pada form sebelum dikirim ke server
  function validasiForm() {
  const namaRegex = /^[a-zA-Z\s.'-]{3,100}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const teleponRegex = /^08\d{8,11}$|^\+?62\d{9,12}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

  if (!namaRegex.test(form.nama.trim())) {
    setError("Nama minimal 3 karakter dan hanya boleh berisi huruf");
    return false;
  }

  const pesanNama = namaTidakValid(form.nama);

if (pesanNama) {
  setError(pesanNama);
  return false;
}

  if (!emailRegex.test(form.email.trim())) {
    setError("Format email tidak valid. Contoh: nama@email.com");
    return false;
  }

  const pesanEmail = emailTidakValid(form.email);

if (pesanEmail) {
  setError(pesanEmail);
  return false;
}

  if (!passwordRegex.test(form.password)) {
    setError("Password minimal 8 karakter, maksimal 64 karakter, harus berisi huruf besar, huruf kecil, dan angka");
    return false;
  }

  if (form.password !== form.konfirmasi_password) {
    setError("Konfirmasi password tidak sama");
    return false;
  }

  if (!teleponRegex.test(form.telepon.trim())) {
  setError("Nomor HP harus format Indonesia. Contoh: 081234567890 atau +6281234567890");
  return false;
}

const pesanTelepon = teleponTidakValid(form.telepon);

if (pesanTelepon) {
  setError(pesanTelepon);
  return false;
}

  if (!["pelanggan", "admin"].includes(form.role)) {
    setError("Role tidak valid");
    return false;
  }

  if (form.role === "admin" && !form.kode_admin.trim()) {
    setError("Kode admin wajib diisi untuk membuat akun admin");
    return false;
  }

  return true;
}

  // Fungsi yang dipanggil saat form disubmit (tombol "Buat Akun" ditekan)
  async function handleRegister(e) {
  e.preventDefault(); // Mencegah reload halaman
  setError("");
  setSuccess("");
  setLoading(true);

  if (!validasiForm()) {
    setLoading(false);
    return;
  }

  try {
    const res = await API.post("/auth/register", {
      ...form,
      nama: form.nama.trim(),
      email: form.email.trim(),
      telepon: form.telepon.trim(),
      kode_admin: form.kode_admin.trim(),
    });

    if (res.data.success) {
      setSuccess("Akun berhasil dibuat. Silakan login.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    }
  } catch (err) {
    setError(err.response?.data?.message || "Gagal membuat akun");
  } finally {
    setLoading(false);
  }
}

  // Mengembalikan UI halaman registrasi dengan animasi dari framer-motion
  return (
     <motion.div
    style={styles.page}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      style={styles.container}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
        <div style={styles.left}>
          <div style={styles.topLink}>
            Sudah punya akun?
            <button type="button" onClick={() => navigate("/login")} style={styles.smallBtn}>
              Login
            </button>
          </div>

          <div style={styles.formBox}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>▣</div>
              <strong>SIPB Rumahan</strong>
            </div>

            <h1 style={styles.title}>Buat Akun Baru</h1>
            <p style={styles.subtitle}>Daftar untuk mulai menggunakan sistem</p>

            <form onSubmit={handleRegister}>
              <label style={styles.label}>Daftar Sebagai</label>
              <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
                <option value="pelanggan">Pelanggan</option>
                <option value="admin">Admin</option>
              </select>

              <label style={styles.label}>Nama Lengkap</label>
              <input
                name="nama"
                value={form.nama}
                onChange={handleChange}
                style={styles.input}
                placeholder="Masukkan nama lengkap"
              />

              <label style={styles.label}>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="nama@email.com"
              />

              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrap}>
  <input
    name="password"
    type={showPassword ? "text" : "password"}
    value={form.password}
    onChange={handleChange}
    maxLength={64}
    style={styles.passwordInput}
    placeholder="Minimal 8 karakter"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={styles.eyeBtn}
  >
    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
  </button>
</div>

              <label style={styles.label}>Konfirmasi Password</label>
              <div style={styles.passwordWrap}>
  <input
    name="konfirmasi_password"
    type={showConfirmPassword ? "text" : "password"}
    value={form.konfirmasi_password}
    onChange={handleChange}
    maxLength={64}
    style={styles.passwordInput}
    placeholder="Ulangi password"
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    style={styles.eyeBtn}
  >
    {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
  </button>
</div>

              <label style={styles.label}>No. Telepon</label>
              <input
  name="telepon"
  value={form.telepon}
  onChange={(e) => {
    const value = e.target.value.replace(/[^\d+]/g, "");
    setForm({
      ...form,
      telepon: value,
    });
  }}
  style={styles.input}
  placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"
/>

              {form.role === "admin" && (
                <>
                  <label style={styles.label}>Kode Admin</label>
                  <input
                    name="kode_admin"
                    value={form.kode_admin}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Masukkan kode admin"
                  />
                </>
              )}

              {error && <div style={styles.error}>{error}</div>}
              {success && <div style={styles.success}>{success}</div>}

              <button type="submit" style={styles.primaryBtn}>
                {loading ? "Memproses..." : "Buat Akun"}
              </button>
            </form>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.shapeOne}></div>
          <div style={styles.shapeTwo}></div>
          <div style={styles.shapeThree}></div>
          <div style={styles.dotsOne}></div>
          <div style={styles.dotsTwo}></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const styles = {

  passwordWrap: {
  width: "100%",
  height: 44,
  border: "1.5px solid #e2e8f0",
  borderRadius: 999,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  marginBottom: 14,
  overflow: "hidden",
},

passwordInput: {
  flex: 1,
  height: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  padding: "0 16px",
  fontSize: 14,
},

eyeBtn: {
  width: 44,
  height: 44,
  border: "none",
  background: "transparent",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
},

  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f8df7, #0f4bd8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 1160,
    minHeight: 760,
    background: "white",
    borderRadius: 26,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "45% 55%",
    border: "6px solid rgba(255,255,255,0.75)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
  },
  left: {
    position: "relative",
    padding: "34px 56px",
    background: "white",
    overflowY: "auto",
  },
  topLink: {
    position: "absolute",
    top: 24,
    right: 34,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    color: "#64748b",
  },
  smallBtn: {
    border: "2px solid #1687e8",
    background: "white",
    color: "#1687e8",
    borderRadius: 999,
    padding: "8px 22px",
    fontWeight: 800,
    cursor: "pointer",
  },
  formBox: {
    maxWidth: 360,
    margin: "70px auto 0",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    color: "#0f172a",
  },
  logoIcon: {
    width: 30,
    height: 30,
    border: "2px solid #0f172a",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    fontSize: 18,
  },
  title: {
    fontSize: 34,
    lineHeight: 1.1,
    margin: "0 0 8px",
    color: "#0f172a",
    fontWeight: 900,
  },
  subtitle: {
    color: "#64748b",
    margin: "0 0 22px",
    fontSize: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 7,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    height: 44,
    border: "1.5px solid #e2e8f0",
    borderRadius: 999,
    padding: "0 16px",
    outline: "none",
    marginBottom: 14,
    background: "#f8fafc",
    fontSize: 14,
  },
  primaryBtn: {
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 999,
    background: "#0f83ed",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 8,
    boxShadow: "0 14px 28px rgba(15, 131, 237, 0.25)",
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  success: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  right: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #0ea5e9, #0f4bd8)",
  },
  shapeOne: {
    position: "absolute",
    width: 560,
    height: 230,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    top: 40,
    right: -90,
    transform: "rotate(-10deg)",
  },
  shapeTwo: {
    position: "absolute",
    width: 600,
    height: 270,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    bottom: -70,
    left: 80,
    transform: "rotate(-12deg)",
  },
  shapeThree: {
    position: "absolute",
    width: 220,
    height: 220,
    border: "2px solid rgba(255,255,255,0.16)",
    transform: "rotate(45deg)",
    left: 30,
    top: 220,
  },
  dotsOne: {
    position: "absolute",
    width: 190,
    height: 130,
    top: 170,
    left: 80,
    backgroundImage: "radial-gradient(rgba(255,255,255,0.36) 2px, transparent 2px)",
    backgroundSize: "18px 18px",
  },
  dotsTwo: {
    position: "absolute",
    width: 130,
    height: 100,
    bottom: 110,
    left: 95,
    backgroundImage: "radial-gradient(rgba(255,255,255,0.32) 2px, transparent 2px)",
    backgroundSize: "18px 18px",
  },
};

export default Register;