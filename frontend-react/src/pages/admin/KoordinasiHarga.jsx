import { useState, useEffect, useRef, useCallback } from "react";
import API from "../../api/api";
import { Search, Save, Trash2, Eye, Paperclip, X, User } from "lucide-react";
import getImageUrl from "../../utils/imageUrl";

function formatRupiah(angka) {
  return "Rp " + parseFloat(angka || 0).toLocaleString("id-ID");
}

// Komponen Halaman Koordinasi Harga (Admin) untuk negosiasi atau penentuan harga pesanan pelanggan
export default function KoordinasiHarga() {
  // === STATE INPUT HARGA ===
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [selectedPesanan, setSelectedPesanan] = useState(null);
  
  const [harga, setHarga] = useState(0);
  const [dp, setDp] = useState(0);
  const [jatuhTempo, setJatuhTempo] = useState(() => {
    const tgl = new Date();
    tgl.setDate(tgl.getDate() + 7);
    return tgl.toISOString().split("T")[0];
  });
  const [catatan, setCatatan] = useState("");

  const sisa = harga - dp;
  const persenDp = harga > 0 ? ((dp / harga) * 100).toFixed(0) : 0;

  // === STATE CHAT ===
  const [chats, setChats] = useState([]);
  const [pesanInput, setPesanInput] = useState("");
  const [gambarInput, setGambarInput] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);

  // === UI STATE ===
  const [toast, setToast] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- LOGIC CHAT (Forward declaration for loadChats) ---
  const loadChats = useCallback(async (id_pesanan) => {
    setLoadingChat(true);
    try {
      const res = await API.get(`/admin/chat/${id_pesanan}`);
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
      scrollToBottom();
    }
  }, []);

  // Fungsi untuk mencari pesanan berdasarkan ID Pesanan / Order ID
  const cariPesanan = useCallback(async (query) => {
    setIsSearching(true);
    try {
      const res = await API.get("/admin/pesanan");
      if (res.data.success) {
        let found = res.data.data.find(p => {
          return p.kode_pesanan.toLowerCase() === query.toLowerCase();
        });
        
        if (!found) {
          found = res.data.data.find(p => {
            return p.kode_pesanan.toLowerCase().includes(query.toLowerCase());
          });
        }

        if (found) {
          setSelectedPesanan(found);
          setHarga(parseFloat(found.total_harga) || 0);
          setDp(parseFloat(found.total_harga) / 2 || 0);
          showToast(`Pesanan ${found.kode_pesanan} ditemukan!`);
          loadChats(found.id_pesanan);
        } else {
          setSelectedPesanan(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [loadChats]);

  const resetForm = useCallback(() => {
    setSelectedPesanan(null);
    setHarga(0);
    setDp(0);
    setCatatan("");
    setChats([]);
    
    const tgl = new Date();
    tgl.setDate(tgl.getDate() + 7);
    setJatuhTempo(tgl.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (orderIdQuery && orderIdQuery.length >= 3) {
        cariPesanan(orderIdQuery);
      } else if (!orderIdQuery) {
        resetForm();
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [orderIdQuery, cariPesanan, resetForm]);

  // Menyimpan kesepakatan harga ke server dan mengubah status pesanan menjadi "diproses"
  const simpanKoordinasi = async () => {
    if (!selectedPesanan) { showToast("Cari dan pilih order ID terlebih dahulu!", "error"); return; }
    if (harga <= 0) { showToast("Harga yang disepakati wajib diisi!", "error"); return; }
    if (dp > harga) { showToast("Total DP tidak boleh lebih dari harga!", "error"); return; }
    if (!jatuhTempo) { showToast("Tanggal jatuh tempo wajib diisi!", "error"); return; }

    setSaving(true);
    try {
      const catatanAdmin = `Harga disepakati: ${formatRupiah(harga)} | DP: ${formatRupiah(dp)} | Jatuh Tempo: ${jatuhTempo}` + (catatan ? ` | Catatan: ${catatan}` : "");
      
      const res = await API.put(`/admin/pesanan/${selectedPesanan.id_pesanan}/status`, {
        status: "diproses",
        catatan_admin: catatanAdmin,
        total_harga: harga,
        harga_koordinasi: harga
      });
      
      if (res.data.success) {
        setSelectedPesanan(prev => ({
          ...prev,
          total_harga: harga,
          harga_koordinasi: harga,
          catatan_admin: catatanAdmin,
          status: "diproses"
        }));
        showToast("Koordinasi harga berhasil disimpan!");
      } else {
        showToast(res.data.message || "Gagal menyimpan!", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setSaving(false);
    }
  };


  // POLLING CHAT
  useEffect(() => {
    let interval;
    if (selectedPesanan) {
      interval = setInterval(() => {
        API.get(`/admin/chat/${selectedPesanan.id_pesanan}`).then(res => {
          if (res.data.success) {
            setChats(prev => {
              if (prev.length !== res.data.data.length) {
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              }
              return res.data.data;
            });
          }
        }).catch(err => console.error(err));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedPesanan]);

  const kirimChat = async () => {
    if (!selectedPesanan || (!pesanInput.trim() && !gambarInput)) return;
    
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("id_pesanan", selectedPesanan.id_pesanan);
      if (pesanInput.trim()) formData.append("pesan", pesanInput.trim());
      if (gambarInput) formData.append("gambar", gambarInput);

      const res = await API.post("/admin/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data.success) {
        setPesanInput("");
        setGambarInput(null);
        loadChats(selectedPesanan.id_pesanan); // Reload chats to show new message
      }
    } catch (err) {
      showToast("Gagal mengirim pesan", "error");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "white", borderRadius: 10, padding: "14px 20px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", borderLeft: `4px solid ${toast.type === "error" ? "#ef4444" : "#10b981"}`, display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500, color: "#1f2937", minWidth: 260, animation: "slideIn 0.3s ease" }}>
          <span>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>
          Koordinasi Harga
        </h2>
      </div>

      {/* 2 Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1, minHeight: 0 }}>
        
        {/* KOLOM 1: Input Harga */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>Input Harga</h3>
          </div>
          
          <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
            {/* Baris 1: Order ID & Nama */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Order ID</label>
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Contoh: ORD-2024-0012"
                    value={orderIdQuery}
                    onChange={e => setOrderIdQuery(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px 9px 34px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
                  />
                  {isSearching && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8" }}>Mencari...</span>}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Nama Pelanggan</label>
                <input
                  type="text"
                  placeholder="Masukkan nama pelanggan"
                  value={selectedPesanan ? selectedPesanan.nama_pelanggan : ""}
                  readOnly
                  style={{ width: "100%", padding: "9px 12px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
                />
              </div>
            </div>

            {/* Baris 2: Harga & DP */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Harga yang disepakati</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#64748b" }}>Rp</span>
                  <input
                    type="text"
                    value={harga ? harga.toLocaleString("id-ID") : ""}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setHarga(raw ? parseInt(raw, 10) : 0);
                    }}
                    placeholder="0"
                    style={{ width: "100%", padding: "9px 12px 9px 36px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Total DP</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#64748b" }}>Rp</span>
                  <input
                    type="text"
                    value={dp ? dp.toLocaleString("id-ID") : ""}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setDp(raw ? parseInt(raw, 10) : 0);
                    }}
                    placeholder="0"
                    style={{ width: "100%", padding: "9px 12px 9px 36px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
                  />
                </div>
              </div>
            </div>

            {/* Baris 3: Jatuh Tempo & Sisa */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={jatuhTempo}
                  onChange={e => setJatuhTempo(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Sisa Pembayaran</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#64748b" }}>Rp</span>
                  <input
                    type="text"
                    value={sisa.toLocaleString("id-ID")}
                    readOnly
                    style={{ width: "100%", padding: "9px 12px 9px 36px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151" }}
                  />
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Catatan Tambahan</label>
              <textarea
                rows={3}
                placeholder="Tambahkan Catatan.."
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151", resize: "vertical" }}
              />
            </div>

            {/* Ringkasan */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Ringkasan Pembayaran</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Harga Total</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{formatRupiah(harga)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Uang Muka</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{formatRupiah(dp)}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>({persenDp}%)</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Sisa Tagihan</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: sisa > 0 ? "#ef4444" : "#10b981" }}>{formatRupiah(sisa)}</div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setOrderIdQuery(""); resetForm(); }}
                style={{ flex: 1, background: "white", border: "2px solid #1e293b", color: "#1e293b", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Trash2 size={16} /> Hapus Harga
              </button>
              <button
                onClick={simpanKoordinasi}
                disabled={saving}
                style={{ flex: 1, background: "#1e293b", border: "none", color: "white", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Harga"}
              </button>
            </div>

          </div>
        </div>

        {/* KOLOM 2: Chat Pelanggan */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Chat Header */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>Chat Pelanggan</h3>
            {selectedPesanan ? (
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#64748b" }}>
                <span>Order ID: <strong style={{ color: "#1e293b" }}>{selectedPesanan.kode_pesanan}</strong></span>
                <span>Pelanggan: <strong style={{ color: "#1e293b" }}>{selectedPesanan.nama_pelanggan}</strong></span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Pilih pesanan di sebelah kiri untuk melihat chat</div>
            )}
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "white", display: "flex", flexDirection: "column", gap: 16 }}>
            {!selectedPesanan ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 13, flexDirection: "column", gap: 10 }}>
                <Search size={32} color="#cbd5e1" />
                <span>Masukkan Order ID untuk memuat riwayat obrolan</span>
              </div>
            ) : loadingChat ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 20 }}>Memuat riwayat obrolan...</div>
            ) : chats.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 20 }}>Belum ada pesan. Mulai obrolan dengan pelanggan!</div>
            ) : (
              chats.map((c, i) => {
                const isAdmin = c.role === 'admin';
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-start" : "flex-end", maxWidth: "80%", alignSelf: isAdmin ? "flex-start" : "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexDirection: isAdmin ? "row" : "row-reverse" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: isAdmin ? "#1e293b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={12} color={isAdmin ? "white" : "#64748b"} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{isAdmin ? "Admin" : "Pelanggan"}</span>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isAdmin ? "row" : "row-reverse" }}>
                      <div style={{ background: isAdmin ? "#f8fafc" : "#1e293b", color: isAdmin ? "#1e293b" : "white", border: isAdmin ? "1px solid #e2e8f0" : "none", padding: "10px 14px", borderRadius: 12, fontSize: 13, borderTopLeftRadius: isAdmin ? 0 : 12, borderTopRightRadius: isAdmin ? 12 : 0, display: "flex", flexDirection: "column", gap: 8, maxWidth: "100%" }}>
                        {c.gambar && (
                          <img src={getImageUrl(c.gambar)} alt="Chat Attachment" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "contain", alignSelf: isAdmin ? "flex-start" : "flex-end", cursor: "pointer" }} onClick={() => window.open(getImageUrl(c.gambar), "_blank")} />
                        )}
                        {c.pesan && <span>{c.pesan}</span>}
                      </div>
                      <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {new Date(c.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 10 }}>
            {gambarInput && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, alignSelf: "flex-start", position: "relative" }}>
                <img src={URL.createObjectURL(gambarInput)} alt="Preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                <div style={{ fontSize: 12, color: "#64748b", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gambarInput.name}</div>
                <button onClick={() => setGambarInput(null)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                  <X size={16} />
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="file"
                id="file-upload-admin"
                accept="image/jpeg,image/png,image/gif"
                style={{ display: "none" }}
                onChange={e => {
                  if (e.target.files[0]) setGambarInput(e.target.files[0]);
                  e.target.value = null;
                }}
                disabled={!selectedPesanan || sending}
              />
              <label htmlFor="file-upload-admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: "white", border: "1.5px solid #e2e8f0", color: "#64748b", cursor: (!selectedPesanan || sending) ? "not-allowed" : "pointer", opacity: (!selectedPesanan || sending) ? 0.5 : 1 }}>
                <Paperclip size={18} />
              </label>

              <textarea
                rows={1}
                placeholder="Tulis pesan..."
                value={pesanInput}
                onChange={e => setPesanInput(e.target.value)}
                disabled={!selectedPesanan || sending}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    kirimChat();
                  }
                }}
                style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#374151", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button
                onClick={kirimChat}
                disabled={!selectedPesanan || (!pesanInput.trim() && !gambarInput) || sending}
                style={{ background: "#1e293b", color: "white", border: "none", borderRadius: 8, height: 40, padding: "0 20px", fontSize: 13, fontWeight: 700, cursor: (!selectedPesanan || (!pesanInput.trim() && !gambarInput) || sending) ? "not-allowed" : "pointer", opacity: (!selectedPesanan || (!pesanInput.trim() && !gambarInput) || sending) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                Kirim
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}