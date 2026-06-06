import { useState, useEffect, useCallback } from "react";
import API from "../../api/api";
import { Search } from "lucide-react";
import getImageUrl from "../../utils/imageUrl";

function formatRupiah(angka) {
  return "Rp " + parseFloat(angka || 0).toLocaleString("id-ID");
}

function generateOrderId(kodePesanan) {
  return kodePesanan || "-";
}

function formatTanggal(tgl) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const STATUS_LABEL = {
  pending: "Menunggu Verifikasi",
  diproses: "Sedang Diproses",
  selesai: "Terverifikasi",
  verifikasi: "Perlu Verifikasi",
};

const STATUS_COLOR = {
  pending: "#d97706",
  diproses: "#2563eb",
  selesai: "#059669",
  verifikasi: "#7c3aed",
};

const STATUS_BG = {
  pending: "#fef3c7",
  diproses: "#dbeafe",
  selesai: "#d1fae5",
  verifikasi: "#ede9fe",
};

// Komponen Halaman Daftar Pesanan (Admin)
export default function DaftarPesanan() {
  const [pesanan, setPesanan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState(null);
  const [statusBaru, setStatusBaru] = useState("");
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [statusBayarBaru, setStatusBayarBaru] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fungsi untuk mengambil daftar pesanan dari server beserta filter dan pencarian
  const loadPesanan = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/admin/pesanan?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterStatus) url += `status=${filterStatus}`;
      const res = await API.get(url);
      if (res.data.success) setPesanan(res.data.data);
    } catch (err) {
      console.error("Gagal memuat pesanan:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const delay = setTimeout(() => {
      loadPesanan();
    }, 300);
    return () => clearTimeout(delay);
  }, [loadPesanan]);

  // Membuka modal verifikasi pesanan
  const openModal = (pesananItem) => {
    setModal({ 
      id: pesananItem.id_pesanan, 
      status: pesananItem.status, 
      catatan: pesananItem.catatan,
      bukti_bayar: pesananItem.bukti_bayar,
      status_bayar: pesananItem.status_bayar,
      catatan_admin: pesananItem.catatan_admin,
      total_harga: pesananItem.total_harga,
      total_dibayar: pesananItem.total_dibayar,
      jumlah_bayar: pesananItem.jumlah_bayar
    });
    setStatusBaru(pesananItem.status);
    setCatatanAdmin(pesananItem.catatan_admin || "");
    setStatusBayarBaru(pesananItem.status_bayar || "pending");
  };

  const closeModal = () => {
    setModal(null);
    setStatusBaru("");
    setCatatanAdmin("");
    setStatusBayarBaru("");
  };

  // Mengirim perubahan status (termasuk status pembayaran dan catatan) ke server
  const updateStatus = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      const res = await API.put(`/admin/pesanan/${modal.id}/status`, {
        status: statusBaru,
        catatan_admin: catatanAdmin,
        status_bayar: modal.bukti_bayar ? statusBayarBaru : undefined
      });
      if (res.data.success) {
        showToast("Status pesanan berhasil diubah!");
        closeModal();
        loadPesanan();
      } else {
        showToast(res.data.message || "Gagal mengubah status", "error");
      }
    } catch {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "white", borderRadius: 10, padding: "14px 20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          borderLeft: `4px solid ${toast.type === "error" ? "#ef4444" : "#10b981"}`,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, fontWeight: 500, color: "#1f2937",
          minWidth: 260,
          animation: "slideIn 0.3s ease",
        }}>
          <span>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Modal Verifikasi */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 16, padding: 28,
              width: "90%", maxWidth: 460,
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 20px" }}>
              Ubah Status Pesanan
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Status Baru
                </label>
                <select
                  value={statusBaru}
                  onChange={e => setStatusBaru(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 14px",
                    border: "1.5px solid #e2e8f0", borderRadius: 8,
                    fontSize: 13, outline: "none", color: "#374151",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="diproses">Diproses</option>
                  <option value="verifikasi">Verifikasi</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Catatan / Deskripsi Pelanggan
                </label>
                <div style={{
                  width: "100%", padding: "9px 14px", boxSizing: "border-box",
                  background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8,
                  fontSize: 13, color: "#374151", minHeight: 60, whiteSpace: "pre-wrap"
                }}>
                  {modal.catatan || "Tidak ada catatan dari pelanggan."}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Bukti Pembayaran Terakhir
                </label>
                {modal.bukti_bayar ? (
                  <img 
                    src={getImageUrl(modal.bukti_bayar)} 
                    alt="Bukti Bayar" 
                    style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                  />
                ) : (
                  <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>
                    Pelanggan belum mengunggah bukti pembayaran.
                  </div>
                )}
                {modal.bukti_bayar && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                      Validasi Pembayaran
                    </label>
                    <select
                      value={statusBayarBaru}
                      onChange={e => setStatusBayarBaru(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 14px",
                        border: "1.5px solid #e2e8f0", borderRadius: 8,
                        fontSize: 13, outline: "none", color: "#374151",
                        background: statusBayarBaru === 'ditolak' ? '#fef2f2' : statusBayarBaru === 'diterima' ? '#f0fdf4' : 'white'
                      }}
                    >
                      <option value="pending">⏳ Menunggu Pengecekan (Pending)</option>
                      <option value="diterima">✅ Terima Pembayaran (Valid)</option>
                      <option value="ditolak">❌ Tolak Pembayaran (Tidak Valid)</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 14, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                {(() => {
                  const isCurrentPending = modal.status_bayar === 'pending';
                  const simulatedDibayar = Number(modal.total_dibayar || 0) + 
                    (isCurrentPending && statusBayarBaru === 'diterima' ? Number(modal.jumlah_bayar || 0) : 0);
                  const sisaTagihan = Number(modal.total_harga || 0) - simulatedDibayar;
                  return (
                    <>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 2 }}>Total Harga</label>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{formatRupiah(modal.total_harga || 0)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 2 }}>Total Dibayar</label>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{formatRupiah(simulatedDibayar)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 2 }}>Sisa Tagihan</label>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sisaTagihan <= 0 ? "#10b981" : "#ef4444" }}>
                          {sisaTagihan <= 0 ? (sisaTagihan < 0 ? "Kelebihan: " + formatRupiah(Math.abs(sisaTagihan)) : "Lunas") : formatRupiah(sisaTagihan)}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                  Catatan Admin (untuk Pelanggan)
                </label>
                <textarea
                  value={catatanAdmin}
                  onChange={e => setCatatanAdmin(e.target.value)}
                  placeholder="Tulis pesan untuk pelanggan (opsional)..."
                  rows={3}
                  style={{
                    width: "100%", padding: "9px 14px", boxSizing: "border-box",
                    border: "1.5px solid #e2e8f0", borderRadius: 8,
                    fontSize: 13, color: "#374151", resize: "vertical",
                    outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={closeModal}
                  style={{
                    flex: 1, padding: 12, border: "1.5px solid #e2e8f0",
                    borderRadius: 10, background: "white", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", color: "#374151",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={updateStatus}
                  disabled={saving}
                  style={{
                    flex: 1, padding: 12, border: "none",
                    borderRadius: 10, background: "#1e293b", color: "white",
                    fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Menyimpan..." : "Simpan Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px" }}>Admin</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>
          Daftar Pesanan
        </h2>
      </div>

      {/* Table Card */}
      <div style={{
        background: "white", borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        border: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        {/* Filter Bar */}
        <div style={{
          padding: "14px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          borderBottom: "1px solid #f1f5f9",
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari Order ID atau nama pelanggan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: "8px 14px 8px 32px", width: 280,
                border: "1.5px solid #e2e8f0", borderRadius: 8,
                fontSize: 13, outline: "none", color: "#374151",
              }}
            />
          </div>

          {/* Filter + Counter */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 12px", width: 150,
                border: "1.5px solid #e2e8f0", borderRadius: 8,
                fontSize: 13, outline: "none", color: "#374151",
              }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
              <option value="verifikasi">Verifikasi</option>
            </select>
            <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
              {pesanan.length} Pesanan
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["Order ID", "Nama Pelanggan", "Total Harga", "Total Dibayar", "Tanggal Pemesanan", "Status", "Tindakan"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#0f172a", background: "white", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>
                    Memuat data...
                  </td>
                </tr>
              ) : pesanan.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>
                    Tidak ada pesanan ditemukan
                  </td>
                </tr>
              ) : (
                pesanan.map(p => {
                  const orderId = generateOrderId(p.kode_pesanan);
                  const totalDibayar = Number(p.total_dibayar || 0);
                  return (
                    <tr
                      key={p.id_pesanan}
                      style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                      onMouseOver={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{orderId}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{p.nama_pelanggan}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{formatRupiah(p.total_harga)}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{formatRupiah(totalDibayar)}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{formatTanggal(p.tanggal_pesan)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: STATUS_COLOR[p.status] || "#64748b",
                          background: STATUS_BG[p.status] || "#f1f5f9",
                          padding: "4px 10px", borderRadius: 20,
                        }}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          onClick={() => openModal(p)}
                          style={{
                            background: "white", border: "2px solid #1e293b",
                            color: "#1e293b", borderRadius: 8,
                            padding: "6px 16px", fontSize: 12,
                            fontWeight: 700, cursor: "pointer",
                            transition: "all 0.2s", whiteSpace: "nowrap",
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "white"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#1e293b"; }}
                        >
                          Verifikasi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}