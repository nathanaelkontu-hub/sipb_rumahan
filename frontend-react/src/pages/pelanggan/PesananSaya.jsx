import { useState } from "react";
import API from "../../api/api";

const kategoriOptions = {
  Elektronik: ["HP", "TV", "Speaker"],
  "Elektronik Rumah Tangga": ["Kulkas", "Mesin Cuci"],
  "Perabot Rumah": ["Sofa", "Lemari", "Spring Bed", "Meja Makan"],
  Otomotif: ["Motor"],
  "Material Bangunan": [
    "Semen",
    "Pasir",
    "Kerikil",
    "Kayu",
    "Cat",
    "Triplek",
    "Besi",
    "Batu Bata",
    "Baja Ringan",
  ],
  Perhiasan: ["Emas"],
};

function buatItemKosong() {
  return {
    nama_barang: "",
    kategori_barang: "",
    sub_kategori_barang: "",
    jumlah: 1,
  };
}

function validasiItemPesanan(item) {
  if (!item.kategori_barang) {
    return "Kategori barang wajib dipilih";
  }

  if (!item.sub_kategori_barang) {
    return "Sub-kategori barang wajib dipilih";
  }

  if (!item.nama_barang.trim()) {
    return "Nama barang wajib diisi";
  }

  if (!item.jumlah || Number(item.jumlah) < 1) {
    return "Jumlah barang minimal 1";
  }

  const nama = item.nama_barang.toLowerCase().trim();
  const sub = item.sub_kategori_barang.toLowerCase();

  const alias = {
    hp: ["hp", "handphone", "smartphone", "iphone", "samsung", "xiaomi", "oppo", "vivo"],
    tv: ["tv", "televisi", "led tv"],
    speaker: ["speaker", "sound", "audio"],
    kulkas: ["kulkas", "lemari es"],
    "mesin cuci": ["mesin cuci", "washer"],
    sofa: ["sofa"],
    lemari: ["lemari"],
    "spring bed": ["spring bed", "springbed", "kasur"],
    "meja makan": ["meja makan"],
    motor: ["motor", "sepeda motor"],
    semen: ["semen"],
    pasir: ["pasir"],
    kerikil: ["kerikil"],
    kayu: ["kayu"],
    cat: ["cat"],
    triplek: ["triplek"],
    besi: ["besi"],
    "batu bata": ["batu bata", "bata"],
    "baja ringan": ["baja ringan"],
    emas: ["emas", "batang emas", "logam mulia"],
  };

  const keyword = alias[sub] || [sub];

  const cocok = keyword.some((kata) => nama.includes(kata));

  if (!cocok) {
    return `Nama barang tidak sesuai dengan sub-kategori ${item.sub_kategori_barang}. Contoh: ${item.sub_kategori_barang}`;
  }

  return null;
}

// Komponen Halaman Pesanan Saya (Pelanggan) untuk membuat permintaan pesanan (order) baru
function PesananSaya() {
  const [form, setForm] = useState({
    items: [buatItemKosong()],
    harga_estimasi: 0,
    catatan: "",
  });

  const [message, setMessage] = useState("");

  // Mengubah data (kategori, nama, jumlah) pada barang tertentu dalam form pesanan
  function handleItemChange(index, field, value) {
    const itemsBaru = [...form.items];

    itemsBaru[index] = {
      ...itemsBaru[index],
      [field]: value,
    };

    if (field === "kategori_barang") {
      itemsBaru[index].sub_kategori_barang = "";
      itemsBaru[index].nama_barang = "";
    }

    if (field === "sub_kategori_barang") {
      itemsBaru[index].nama_barang = value;
    }

    setForm({
      ...form,
      items: itemsBaru,
    });
  }

  function tambahItem() {
    setMessage("");

    setForm({
      ...form,
      items: [...form.items, buatItemKosong()],
    });
  }

  function hapusItem(index) {
    setMessage("");

    if (form.items.length === 1) {
      setMessage("Minimal harus ada 1 barang dalam pesanan");
      return;
    }

    const itemsBaru = form.items.filter((_, i) => i !== index);

    setForm({
      ...form,
      items: itemsBaru,
    });
  }

  function resetForm() {
    setMessage("");

    setForm({
      items: [buatItemKosong()],
      harga_estimasi: 0,
      catatan: "",
    });
  }

  // Memvalidasi seluruh barang dan mengirimkan permintaan pesanan baru ke server
  async function kirimPesanan(e) {
    e.preventDefault();
    setMessage("");

    for (let i = 0; i < form.items.length; i++) {
      const errorItem = validasiItemPesanan(form.items[i]);

      if (errorItem) {
        setMessage(`Barang ${i + 1}: ${errorItem}`);
        return;
      }
    }

    try {
      const catatanText = form.catatan || "";
      if (catatanText.length < 10) {
        setMessage("Deskripsi minimal 10 karakter");
        return;
      }
      if (/(.)\1{9,}/i.test(catatanText)) {
        setMessage("Deskripsi terdeteksi spam: terdapat karakter yang diulang lebih dari 10 kali");
        return;
      }

      const res = await API.post("/pelanggan/pesanan", {
        items: form.items.map((item) => ({
          nama_barang: item.nama_barang.trim(),
          kategori_barang: item.kategori_barang,
          sub_kategori_barang: item.sub_kategori_barang,
          jumlah: Number(item.jumlah),
        })),
        harga_estimasi: Number(form.harga_estimasi || 0),
        catatan: form.catatan || null,
      });

      if (res.data.success) {
        setMessage("Permintaan pesanan berhasil dikirim");

        setForm({
          items: [buatItemKosong()],
          harga_estimasi: 0,
          catatan: "",
        });
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal membuat pesanan");
    }
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
          Pesanan Saya
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <span style={{ fontSize: 22 }}>+</span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Permintaan Pesanan Baru
          </h3>
        </div>

        <form onSubmit={kirimPesanan} style={{ padding: 24 }}>
          <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
            {form.items.map((item, index) => (
              <div key={index} style={styles.itemCard}>
                <div style={styles.itemHeader}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>
                    Barang {index + 1}
                  </h4>

                  <button
                    type="button"
                    onClick={() => hapusItem(index)}
                    style={styles.deleteItemBtn}
                  >
                    Hapus
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <div>
                    <label style={styles.label}>Kategori Barang</label>
                    <select
                      value={item.kategori_barang}
                      onChange={(e) =>
                        handleItemChange(index, "kategori_barang", e.target.value)
                      }
                      style={styles.input}
                    >
                      <option value="">Pilih kategori</option>
                      {Object.keys(kategoriOptions).map((kategori) => (
                        <option key={kategori} value={kategori}>
                          {kategori}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Sub-kategori</label>
                    <select
                      value={item.sub_kategori_barang}
                      onChange={(e) =>
                        handleItemChange(index, "sub_kategori_barang", e.target.value)
                      }
                      style={styles.input}
                      disabled={!item.kategori_barang}
                    >
                      <option value="">Pilih sub-kategori</option>
                      {(kategoriOptions[item.kategori_barang] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: 18,
                    marginTop: 18,
                  }}
                >
                  <div>
                    <label style={styles.label}>Nama Barang</label>
                    <input
                      value={item.nama_barang}
                      onChange={(e) =>
                        handleItemChange(index, "nama_barang", e.target.value)
                      }
                      style={styles.input}
                      placeholder={
                        item.sub_kategori_barang
                          ? `Contoh: ${item.sub_kategori_barang}`
                          : "Pilih sub-kategori dulu"
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={item.jumlah}
                      onChange={(e) =>
                        handleItemChange(index, "jumlah", e.target.value)
                      }
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={tambahItem} style={styles.addItemBtn}>
              + Tambah Barang
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>Deskripsi (Wajib diisi untuk kejelasan spesifikasi)</label>
            <textarea
              name="catatan"
              value={form.catatan}
              onChange={(e) =>
                setForm({
                  ...form,
                  catatan: e.target.value,
                })
              }
              style={{ ...styles.input, minHeight: 110, paddingTop: 12 }}
              placeholder="Tambahkan detail spesifikasi pesanan Anda (Misal: 'Warna hitam, ukuran panjang 2 meter, kaki besi')"
              minLength={10}
              maxLength={1000}
              required
            />
          </div>

          {message && (
            <div style={styles.messageBox}>
              {message}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20 }}>
            <button type="button" onClick={resetForm} style={styles.grayButton}>
              Hapus
            </button>

            <button type="submit" style={styles.darkButton}>
              Masukkan Permintaan Pesanan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid #eef2f7",
  },

  header: {
    padding: "18px 22px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    display: "block",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    minHeight: 44,
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "0 14px",
    outline: "none",
    background: "white",
    fontSize: 13,
  },

  itemCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 18,
  },

  itemHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  deleteItemBtn: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  addItemBtn: {
    height: 44,
    border: "1.5px dashed #0f83ed",
    borderRadius: 12,
    background: "#eff6ff",
    color: "#0f83ed",
    fontWeight: 900,
    cursor: "pointer",
  },

  grayButton: {
    height: 44,
    border: "none",
    borderRadius: 10,
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },

  darkButton: {
    height: 44,
    border: "none",
    borderRadius: 10,
    background: "#1e293b",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  messageBox: {
    marginBottom: 14,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  },
};

export default PesananSaya;