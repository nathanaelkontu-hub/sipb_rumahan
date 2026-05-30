import { useState, useEffect, useCallback } from "react";
import API from "../../api/api";
import { Search, Mail, Phone } from "lucide-react";

function formatRupiah(angka) {
  return "Rp " + parseFloat(angka || 0).toLocaleString("id-ID");
}

function generateCustomerId(idPelanggan, tglDaftar) {
  if (!tglDaftar) return "-";
  const tahun = new Date(tglDaftar).getFullYear();
  const id = String(idPelanggan).padStart(4, "0");
  return `CUST-${tahun}-${id}`;
}

function formatTanggal(tgl) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

const STATUS_WARNA = { aktif: "#10b981", nonaktif: "#94a3b8", ban: "#ef4444" };
const STATUS_LABEL = { aktif: "Active", nonaktif: "Nonaktif", ban: "Banned" };

const ORDER_STATUS_LABEL = {
  pending: "Menunggu Verifikasi",
  diproses: "Sedang Diproses",
  selesai: "Terverifikasi",
  verifikasi: "Menunggu Verifikasi",
};

const ORDER_STATUS_COLOR = {
  pending: "#f59e0b",
  diproses: "#3b82f6",
  selesai: "#10b981",
  verifikasi: "#f59e0b",
};

export default function DaftarPelanggan() {
  const [pelanggan, setPelanggan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailPesanan, setDetailPesanan] = useState([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState(null); // { id, nama }
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadPelanggan = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/admin/pelanggan";
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await API.get(url);
      if (res.data.success) {
        setPelanggan(res.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat pelanggan:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      loadPelanggan();
    }, 300);
    return () => clearTimeout(delay);
  }, [loadPelanggan]);

  const openDetailModal = async (idPelanggan, namaPelanggan) => {
    setSelectedPelanggan({ id: idPelanggan, nama: namaPelanggan });
    setModalOpen(true);
    setLoadingDetail(true);
    setDetailPesanan([]);

    try {
      const res = await API.get(`/admin/pesanan?search=${encodeURIComponent(namaPelanggan)}`);
      if (res.data.success) {
        const filtered = res.data.data.filter((p) => p.id_pelanggan === idPelanggan);
        
        // Ambil detail barang untuk setiap pesanan
        const pesananWithItems = await Promise.all(
          filtered.map(async (order) => {
            try {
              const detailRes = await API.get(`/admin/pesanan/${order.id_pesanan}`);
              if (detailRes.data.success) {
                return { ...order, items: detailRes.data.data.items };
              }
            } catch (err) {
              console.error("Gagal memuat item pesanan:", err);
            }
            return { ...order, items: [] };
          })
        );
        
        setDetailPesanan(pesananWithItems);
      }
    } catch (err) {
      console.error("Gagal memuat detail pesanan pelanggan:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPelanggan(null);
    setDetailPesanan([]);
  };

  return (
    <div>
      {/* Modal Detail Pesanan */}
      {modalOpen && selectedPelanggan && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
              width: "90%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {selectedPelanggan.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                    {selectedPelanggan.nama}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {detailPesanan.length} Total Pesanan
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                Riwayat Pesanan:
              </div>

              {loadingDetail ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px", fontSize: 13 }}>
                  Memuat data pesanan...
                </div>
              ) : detailPesanan.length > 0 ? (
                detailPesanan.map((p) => {
                  const orderId = p.kode_pesanan || "-";
                  return (
                    <div
                      key={p.id_pesanan}
                      style={{
                        padding: 12,
                        background: "#f8fafc",
                        borderRadius: 8,
                        marginBottom: 10,
                        border: "1px solid #f1f5f9"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: p.items && p.items.length > 0 ? 8 : 0 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                            {orderId}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {formatTanggal(p.tanggal_pesan)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {formatRupiah(p.total_harga)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: ORDER_STATUS_COLOR[p.status] || "#64748b",
                            }}
                          >
                            {ORDER_STATUS_LABEL[p.status] || p.status}
                          </div>
                        </div>
                      </div>

                      {p.items && p.items.length > 0 && (
                        <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 8, marginTop: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Daftar Barang:</div>
                          {p.items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 4 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#94a3b8" }}></span>
                                {item.nama_barang}
                              </span>
                              <span>{item.jumlah} {item.satuan || 'pcs'} x {formatRupiah(item.harga_satuan)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px", fontSize: 13 }}>
                  Belum ada pesanan
                </div>
              )}
            </div>
            <button
              onClick={closeModal}
              style={{
                width: "100%",
                background: "#f1f5f9",
                border: "none",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px" }}>Admin</p>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>
          Daftar Pelanggan
        </h2>
      </div>

      {/* Card Table */}
      <div style={{ background: "white", borderRadius: 14, padding: 0, overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Filter / Search */}
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 280,
                padding: "9px 14px 9px 38px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                color: "#374151"
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
            {pelanggan.length} Pelanggan
          </span>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>ID Pelanggan</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Informasi Kontak</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Total Barang</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Total Belanja</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Tanggal Login</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Status</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>
                    Memuat data pelanggan...
                  </td>
                </tr>
              ) : pelanggan.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 20px", fontSize: 13 }}>
                    Tidak ada pelanggan ditemukan
                  </td>
                </tr>
              ) : (
                pelanggan.map((p) => {
                  const customerId = generateCustomerId(p.id_pelanggan, p.created_at);
                  const tglLogin = p.updated_at
                    ? new Date(p.updated_at).toISOString().split("T")[0]
                    : new Date(p.created_at).toISOString().split("T")[0];

                  return (
                    <tr
                      key={p.id_pelanggan}
                      style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.2s" }}
                      onMouseOver={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{customerId}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Mail size={13} color="#64748b" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#374151" }}>{p.email || "-"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Phone size={13} color="#64748b" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#374151" }}>{p.telepon || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 13, color: "#374151" }}>{p.total_pesanan || 0}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          {formatRupiah(p.total_belanja || 0)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>{tglLogin}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: STATUS_WARNA[p.status] || "#64748b",
                          }}
                        >
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          onClick={() => openDetailModal(p.id_pelanggan, p.nama)}
                          style={{
                            background: "white",
                            border: "2px solid #1e293b",
                            color: "#1e293b",
                            borderRadius: 8,
                            padding: "6px 16px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "white"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#1e293b"; }}
                        >
                          Lihat Pesanan
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