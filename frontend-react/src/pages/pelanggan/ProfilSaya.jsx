import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import API from "../../api/api";

import {
  getKotaKabupaten,
  getKecamatan,
  getKelurahan,
  isLokasiValid,
} from "../../data/lokasiSulut";

function getStoredUser() {
  return JSON.parse(
    localStorage.getItem("sipb_pelanggan_user") ||
      sessionStorage.getItem("sipb_pelanggan_user") ||
      "{}"
  );
}

const initialUser = getStoredUser();

const initialFotoProfil = initialUser.foto_profil
  ? `http://localhost:3000/uploads/${initialUser.foto_profil}`
  : "";

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
    "tolol",
  ];

  if (blacklist.some((kata) => value.includes(kata))) {
    return "Nama mengandung kata yang tidak diperbolehkan";
  }

  if (/(.)\1{3,}/.test(value)) {
    return "Nama tidak boleh memiliki huruf yang sama lebih dari 3 kali berturut-turut";
  }

  const polaKeyboard = ["asdf", "asdfg", "asdfgh", "qwer", "qwerty", "zxcv"];

  if (polaKeyboard.some((pola) => value.includes(pola))) {
    return "Nama tidak boleh memakai pola huruf acak";
  }

  return null;
}

function teleponTidakValid(telepon) {
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
    "0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889",
  ];

  if (!prefixOperatorValid.includes(prefix4Digit)) {
    return "Prefix nomor HP tidak valid. Contoh prefix valid: 0812, 0856, 0896";
  }

  if (/^(\+?62|08)(\d)\2{7,}$/.test(value)) {
    return "Nomor HP tidak boleh berisi angka berulang berlebihan";
  }

  return null;
}

function namaJalanTidakValid(alamat) {
  const value = alamat.trim();
  const lowerValue = value.toLowerCase();

  const alamatRegex = /^[a-zA-Z0-9\s.,/-]{15,100}$/;

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

  const memakaiPrefix = prefixValid.some((prefix) =>
    lowerValue.startsWith(prefix)
  );

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

function noRumahTidakValid(noRumah) {
  const value = noRumah.trim();

  const noRumahRegex = /^[a-zA-Z0-9\s./-]{1,15}$/;

  if (!noRumahRegex.test(value)) {
    return "No rumah harus 1 sampai 15 karakter dan hanya boleh berisi huruf, angka, spasi, titik, /, dan -";
  }

  if (!/[a-zA-Z0-9]/.test(value)) {
    return "No rumah harus mengandung angka atau huruf. Contoh: 7, C, 12-A, atau Blok C/7";
  }

  return null;
}

function namaJalanWarning(alamat) {
  const value = alamat.trim().toLowerCase();

  const awalanValid = [
    "jl.",
    "jalan",
    "gang",
    "lorong",
    "pertigaan",
    "perempatan",
    "komplek",
    "perum",
    "blok",
    "rt"
  ];

  const adaAwalan = awalanValid.some((awalan) => value.startsWith(awalan));

  if (!adaAwalan) {
    return "Nama jalan terlihat belum jelas. Gunakan awalan seperti Jl., Jalan, Gang, Lorong, Komplek, Perum, Blok, atau RT. Contoh: Jl. Merdeka No. 104";
  }

  const jumlahKata = value.split(/\s+/).filter(Boolean).length;

  if (jumlahKata < 2) {
    return "Nama jalan terlalu singkat. Contoh yang benar: Jl. Merdeka atau Gang Mawar";
  }

  return null;
}

function ProfilSaya() {
  const [form, setForm] = useState(() => {
    const user = getStoredUser();

    return {
      nama: user.nama || "",
      email: user.email || "",
      telepon: user.telepon || "",
      alamat: user.alamat || "",
      kota: user.kota || "",
      kecamatan: user.kecamatan || "",
      kelurahan: user.kelurahan || "",
      no_rumah: user.no_rumah || "",
    };
  });

  const [passwordForm, setPasswordForm] = useState({
    password_lama: "",
    password_baru: "",
    konfirmasi: "",
  });

  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const [fotoProfil, setFotoProfil] = useState(initialFotoProfil);
  const [message, setMessage] = useState("");
  const [loadingFoto, setLoadingFoto] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleKotaChange(e) {
  setForm({
    ...form,
    kota: e.target.value,
    kecamatan: "",
    kelurahan: "",
  });
}

function handleKecamatanChange(e) {
  setForm({
    ...form,
    kecamatan: e.target.value,
    kelurahan: "",
  });
}

function handleKelurahanChange(e) {
  setForm({
    ...form,
    kelurahan: e.target.value,
  });
}

  function handlePasswordChange(e) {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  }

  function validasiProfil() {
    const namaRegex = /^[a-zA-Z\s.'-]{3,100}$/;

    if (!namaRegex.test(form.nama.trim())) {
      setMessage("Nama minimal 3 karakter dan hanya boleh berisi huruf");
      return false;
    }

    const pesanNama = namaTidakValid(form.nama);

    if (pesanNama) {
      setMessage(pesanNama);
      return false;
    }

    const pesanTelepon = teleponTidakValid(form.telepon);

    if (pesanTelepon) {
      setMessage(pesanTelepon);
      return false;
    }

    if (!form.alamat.trim()) {
  setMessage("Nama jalan wajib diisi");
  return false;
}

const pesanNamaJalan = namaJalanTidakValid(form.alamat);

if (pesanNamaJalan) {
  setMessage(pesanNamaJalan);
  return false;
}

const warningNamaJalan = namaJalanWarning(form.alamat);

if (warningNamaJalan) {
  setMessage(warningNamaJalan);
  return false;
}

    if (!form.kota.trim()) {
  setMessage("Kota/Kabupaten wajib dipilih");
  return false;
}
    if (!form.no_rumah.trim()) {
  setMessage("No rumah wajib diisi");
  return false;
}

const pesanNoRumah = noRumahTidakValid(form.no_rumah);

if (pesanNoRumah) {
  setMessage(pesanNoRumah);
  return false;
}

    if (!form.kecamatan.trim()) {
      setMessage("Kecamatan wajib diisi");
      return false;
    }

    if (!form.kelurahan.trim()) {
      setMessage("Kelurahan wajib diisi");
      return false;
    }

    if (!isLokasiValid(form.kota, form.kecamatan, form.kelurahan)) {
  setMessage("Kombinasi Kota/Kabupaten, Kecamatan, dan Kelurahan tidak valid");
  return false;
}

    return true;
  }

  async function simpanProfil() {
    setMessage("");

    if (!validasiProfil()) {
      return;
    }

    try {
      const res = await API.put("/auth/profile", {
        nama: form.nama.trim(),
        telepon: form.telepon.trim(),
        alamat: form.alamat.trim(),
        kota: form.kota.trim(),
        kecamatan: form.kecamatan.trim(),
        kelurahan: form.kelurahan.trim(),
        no_rumah: form.no_rumah.trim(),
      });

      if (res.data.success) {
        const userLama = getStoredUser();

        const userBaru = {
          ...userLama,
          nama: form.nama.trim(),
          telepon: form.telepon.trim(),
          alamat: form.alamat.trim(),
          kota: form.kota.trim(),
          kecamatan: form.kecamatan.trim(),
          kelurahan: form.kelurahan.trim(),
          no_rumah: form.no_rumah.trim(),
        };

        if (localStorage.getItem("sipb_pelanggan_user")) {
          localStorage.setItem("sipb_pelanggan_user", JSON.stringify(userBaru));
        } else {
          sessionStorage.setItem("sipb_pelanggan_user", JSON.stringify(userBaru));
        }

        setForm({
          nama: userBaru.nama || "",
          email: userBaru.email || "",
          telepon: userBaru.telepon || "",
          alamat: userBaru.alamat || "",
          kota: userBaru.kota || "",
          kecamatan: userBaru.kecamatan || "",
          kelurahan: userBaru.kelurahan || "",
          no_rumah: userBaru.no_rumah || "",
        });

        setMessage("Profil berhasil diperbarui");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal memperbarui profil");
    }
  }

  async function updatePassword() {
    setMessage("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

    if (
      !passwordForm.password_lama ||
      !passwordForm.password_baru ||
      !passwordForm.konfirmasi
    ) {
      setMessage("Semua kolom password wajib diisi");
      return;
    }

    if (!passwordRegex.test(passwordForm.password_baru)) {
      setMessage(
        "Password baru minimal 8 karakter, maksimal 64 karakter, harus berisi huruf besar, huruf kecil, dan angka"
      );
      return;
    }

    if (passwordForm.password_baru !== passwordForm.konfirmasi) {
      setMessage("Konfirmasi password tidak sama");
      return;
    }

    if (passwordForm.password_lama === passwordForm.password_baru) {
      setMessage("Password baru tidak boleh sama dengan password lama");
      return;
    }

    try {
      const res = await API.put("/auth/password", {
        password_lama: passwordForm.password_lama,
        password_baru: passwordForm.password_baru,
      });

      if (res.data.success) {
        setMessage("Password berhasil diperbarui");

        setPasswordForm({
          password_lama: "",
          password_baru: "",
          konfirmasi: "",
        });

        setShowPasswordLama(false);
        setShowPasswordBaru(false);
        setShowKonfirmasi(false);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal memperbarui password");
    }
  }

  async function uploadFotoProfil(e) {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("File harus JPG atau PNG");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran foto maksimal 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("foto_profil", file);

    try {
      setLoadingFoto(true);
      setMessage("");

      const res = await API.post("/auth/profile/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setFotoProfil(res.data.foto_url + "?t=" + Date.now());

        const userLama = getStoredUser();

        const userBaru = {
          ...userLama,
          foto_profil: res.data.foto_profil,
        };

        if (localStorage.getItem("sipb_pelanggan_user")) {
          localStorage.setItem("sipb_pelanggan_user", JSON.stringify(userBaru));
        } else {
          sessionStorage.setItem("sipb_pelanggan_user", JSON.stringify(userBaru));
        }

        setMessage("Foto profil berhasil diperbarui");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal upload foto profil");
    } finally {
      setLoadingFoto(false);
    }
  }

  function batalPerubahan() {
    const user = getStoredUser();

    setForm({
      nama: user.nama || "",
      email: user.email || "",
      telepon: user.telepon || "",
      alamat: user.alamat || "",
      kota: user.kota || "",
      kecamatan: user.kecamatan || "",
      kelurahan: user.kelurahan || "",
      no_rumah: user.no_rumah || "",
    });

    setMessage("Perubahan dibatalkan");
  }

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <div style={{ marginTop: -14, marginBottom: 28 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.1,
          }}
        >
          Pengaturan Profil
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Informasi Pribadi" icon="👤">
            <Input
              label="Nama Lengkap"
              name="nama"
              value={form.nama}
              onChange={handleChange}
            />

            <Input
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled
            />

            <Input
              label="No. Telepon"
              name="telepon"
              value={form.telepon}
              maxLength={15}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d+]/g, "");

                setForm({
                  ...form,
                  telepon: value,
                });
              }}
            />
          </Card>

          <Card title="Informasi Alamat" icon="📍">
  <Input
    label="Nama Jalan"
    name="alamat"
    value={form.alamat}
    onChange={handleChange}
    minLength={15}
    maxLength={100}
    placeholder="Contoh: Jl. Merdeka No. 104"
  />

  <div style={styles.grid2}>
    <SelectInput
      label="Kota/Kabupaten"
      name="kota"
      value={form.kota}
      onChange={handleKotaChange}
      options={getKotaKabupaten()}
      placeholder="Pilih Kota/Kabupaten"
    />

    <Input
      label="No Rumah"
      name="no_rumah"
      value={form.no_rumah}
      onChange={handleChange}
      minLength={1}
      maxLength={15}
      placeholder="Contoh: 104, C, atau 12-A"
    />
  </div>

  <div style={styles.grid2}>
    <SelectInput
      label="Kecamatan"
      name="kecamatan"
      value={form.kecamatan}
      onChange={handleKecamatanChange}
      options={getKecamatan(form.kota)}
      placeholder="Pilih Kecamatan"
      disabled={!form.kota}
    />

    <SelectInput
      label="Kelurahan"
      name="kelurahan"
      value={form.kelurahan}
      onChange={handleKelurahanChange}
      options={getKelurahan(form.kota, form.kecamatan)}
      placeholder="Pilih Kelurahan"
      disabled={!form.kota || !form.kecamatan}
    />
  </div>
</Card>

          <Card title="Ganti Kata Sandi" icon="🔒">
            <PasswordInput
              label="Kata Sandi Sekarang"
              name="password_lama"
              value={passwordForm.password_lama}
              onChange={handlePasswordChange}
              show={showPasswordLama}
              onToggle={() => setShowPasswordLama(!showPasswordLama)}
              placeholder="Masukkan password lama"
            />

            <PasswordInput
              label="Kata Sandi Baru"
              name="password_baru"
              value={passwordForm.password_baru}
              onChange={handlePasswordChange}
              show={showPasswordBaru}
              onToggle={() => setShowPasswordBaru(!showPasswordBaru)}
              placeholder="Minimal 8 karakter"
            />

            <PasswordInput
              label="Konfirmasi"
              name="konfirmasi"
              value={passwordForm.konfirmasi}
              onChange={handlePasswordChange}
              show={showKonfirmasi}
              onToggle={() => setShowKonfirmasi(!showKonfirmasi)}
              placeholder="Ulangi password baru"
            />

            <button type="button" onClick={updatePassword} style={styles.darkSmall}>
              Perbarui Kata Sandi
            </button>
          </Card>

          {message && <div style={styles.messageBox}>{message}</div>}

          <div style={{ display: "flex", gap: 20 }}>
            <button type="button" style={styles.grayBtn} onClick={batalPerubahan}>
              Tidak
            </button>

            <button type="button" onClick={simpanProfil} style={styles.darkBtn}>
              Simpan Perubahan
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ ...styles.card, textAlign: "center", padding: 24 }}>
            <div style={styles.avatar}>
              {fotoProfil ? (
                <img
                  src={fotoProfil}
                  alt="Foto Profil"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 18,
                  }}
                />
              ) : (
                "👤"
              )}
            </div>

            <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
              {form.nama || "Pelanggan"}
            </div>

            <div style={{ fontSize: 13, color: "#64748b", margin: "6px 0 16px" }}>
              Akun Pelanggan
            </div>

            <label style={styles.outlineBtn}>
              {loadingFoto ? "Mengupload..." : "Ganti Foto Profil"}
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={uploadFotoProfil}
                style={{ display: "none" }}
                disabled={loadingFoto}
              />
            </label>
          </div>

          <div style={{ ...styles.card, padding: 24 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 12,
              }}
            >
              Status Akun
            </div>

            <div style={{ fontSize: 13, color: "#334155", marginBottom: 12 }}>
              Akunmu aktif dan terverifikasi
            </div>

            <div style={styles.infoRow}>
              <span>Anggota dari:</span>
              <strong>Jan 2025</strong>
            </div>

            <div style={styles.infoRow}>
              <span>Total Pesanan:</span>
              <strong>0</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
          {title}
        </h3>
      </div>

      <div style={{ padding: 20, display: "grid", gap: 14 }}>{children}</div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  disabled = false,
  name,
  value,
  onChange,
  minLength,
  maxLength,
  placeholder = "",
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        style={{
          ...styles.input,
          background: disabled ? "#f8fafc" : "white",
        }}
      />
    </div>
  );
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>

      <div style={styles.passwordWrap}>
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value || ""}
          onChange={onChange}
          maxLength={64}
          placeholder={placeholder}
          style={styles.passwordInput}
        />

        <button type="button" onClick={onToggle} style={styles.eyeBtn}>
          {show ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    borderRadius: 18,
    border: "1px solid #eef2f7",
    overflow: "hidden",
  },

  cardHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    display: "block",
    marginBottom: 6,
  },

  input: {
    width: "100%",
    height: 44,
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "0 14px",
    outline: "none",
    fontSize: 13,
  },

  passwordWrap: {
    width: "100%",
    height: 44,
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    background: "white",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "0 14px",
    fontSize: 13,
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

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 18,
    background: "#f1f5f9",
    margin: "0 auto 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    overflow: "hidden",
  },

  outlineBtn: {
    background: "white",
    border: "1.5px solid #1e293b",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-block",
    fontSize: 13,
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 10,
  },

  grayBtn: {
    width: 160,
    height: 44,
    border: "none",
    borderRadius: 10,
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },

  darkBtn: {
    width: 220,
    height: 44,
    border: "none",
    borderRadius: 10,
    background: "#1e293b",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  darkSmall: {
    width: "max-content",
    height: 40,
    border: "none",
    borderRadius: 10,
    background: "#1e293b",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    padding: "0 16px",
  },

  messageBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  },
};

function SelectInput({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Pilih data",
  disabled = false,
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...styles.input,
          background: disabled ? "#f8fafc" : "white",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="">{placeholder}</option>

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProfilSaya;