import { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import { Paperclip, X } from "lucide-react";
import getImageUrl from "../../utils/imageUrl";

// Komponen Halaman Chat dengan Admin (Pelanggan)
function ChatAdmin() {
  const [pesanan, setPesanan] = useState([]);
  const [selectedPesanan, setSelectedPesanan] = useState("");
  const [chats, setChats] = useState([]);
  const [pesan, setPesan] = useState("");
  const [gambarInput, setGambarInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadPesanan();
  }, []);

  useEffect(() => {
    if (selectedPesanan) {
      loadChat(selectedPesanan);
    }
  }, [selectedPesanan]);

  // POLLING CHAT
  useEffect(() => {
    let interval;
    if (selectedPesanan) {
      interval = setInterval(() => {
        API.get(`/pelanggan/chat/${selectedPesanan}`).then(res => {
          if (res.data.success) {
            setChats(prev => {
              if (prev.length !== res.data.data.length) {
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              }
              return res.data.data || [];
            });
          }
        }).catch(err => console.error(err));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedPesanan]);

  async function loadPesanan() {
    try {
      const res = await API.get("/pelanggan/pesanan");

      if (res.data.success) {
        const data = res.data.data || [];
        setPesanan(data);

        if (data.length > 0) {
          setSelectedPesanan(data[0].id_pesanan);
        }
      }
    } catch {
      setMessage("Gagal mengambil daftar pesanan");
    }
  }

  // Fungsi untuk memuat riwayat obrolan untuk pesanan tertentu
  async function loadChat(idPesanan) {
    try {
      setLoading(true);

      const res = await API.get(`/pelanggan/chat/${idPesanan}`);

      if (res.data.success) {
        setChats(res.data.data || []);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal mengambil chat");
    } finally {
      setLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  // Mengirim pesan (teks dan/atau gambar) ke server chat
  async function kirimChat(e) {
    if (e) e.preventDefault();

    if (!pesan.trim() && !gambarInput) {
      setMessage("Pesan atau gambar tidak boleh kosong");
      return;
    }

    if (!selectedPesanan) {
      setMessage("Pilih pesanan terlebih dahulu");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id_pesanan", selectedPesanan);
      if (pesan.trim()) formData.append("pesan", pesan.trim());
      if (gambarInput) formData.append("gambar", gambarInput);

      const res = await API.post("/pelanggan/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setPesan("");
        setGambarInput(null);
        setMessage("");
        loadChat(selectedPesanan);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal mengirim pesan");
    }
  }

  return (
    <div style={{ padding: "0 28px 28px" }}>
      <div style={{ marginTop: -14, marginBottom: 28 }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
          Chat dengan Admin
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.adminAvatar}>A</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
              Admin Support
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Pilih pesanan untuk memulai chat
            </div>
          </div>

          <select
            value={selectedPesanan}
            onChange={(e) => setSelectedPesanan(e.target.value)}
            style={styles.select}
          >
            {pesanan.length === 0 ? (
              <option value="">Belum ada pesanan</option>
            ) : (
              pesanan.map((item) => (
                <option key={item.id_pesanan} value={item.id_pesanan}>
                  {item.kode_pesanan || `ORD-${item.id_pesanan}`}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={styles.chatBox}>
          {loading ? (
            <div style={styles.empty}>Memuat chat...</div>
          ) : chats.length === 0 ? (
            <div style={styles.empty}>Belum ada pesan untuk pesanan ini</div>
          ) : (
            chats.map((chat) => {
              const dariUser = chat.role === "pelanggan";

              return (
                <div
                  key={chat.id_chat}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: dariUser ? "flex-end" : "flex-start",
                    alignSelf: dariUser ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexDirection: dariUser ? "row-reverse" : "row" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: dariUser ? "#e2e8f0" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: dariUser ? "#64748b" : "white" }}>
                      {dariUser ? "P" : "A"}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{dariUser ? "Anda" : "Admin"}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: dariUser ? "row-reverse" : "row" }}>
                    <div
                      style={{
                        padding: "10px 14px",
                        fontSize: 13,
                        lineHeight: 1.4,
                        background: dariUser ? "#1e293b" : "#f8fafc",
                        color: dariUser ? "white" : "#1e293b",
                        border: dariUser ? "none" : "1px solid #e2e8f0",
                        borderRadius: 12,
                        borderTopLeftRadius: dariUser ? 12 : 0,
                        borderTopRightRadius: dariUser ? 0 : 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        maxWidth: "100%",
                      }}
                    >
                      {chat.gambar && (
                        <img src={getImageUrl(chat.gambar)} alt="Chat Attachment" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "contain", alignSelf: dariUser ? "flex-end" : "flex-start", cursor: "pointer" }} onClick={() => window.open(getImageUrl(chat.gambar), "_blank")} />
                      )}
                      {chat.pesan && <span>{chat.pesan}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(chat.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {message && (
          <div style={{ padding: "0 18px 10px", color: "#ef4444", fontSize: 13 }}>
            {message}
          </div>
        )}

        <div style={{ padding: "16px 18px", borderTop: "1px solid #f1f5f9", background: "white", display: "flex", flexDirection: "column", gap: 10 }}>
          {gambarInput && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, alignSelf: "flex-start", position: "relative" }}>
              <img src={URL.createObjectURL(gambarInput)} alt="Preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
              <div style={{ fontSize: 12, color: "#64748b", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gambarInput.name}</div>
              <button onClick={() => setGambarInput(null)} type="button" style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                <X size={16} />
              </button>
            </div>
          )}
          <form onSubmit={kirimChat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="file"
              id="file-upload-pelanggan"
              accept="image/jpeg,image/png,image/gif"
              style={{ display: "none" }}
              onChange={e => {
                if (e.target.files[0]) setGambarInput(e.target.files[0]);
                e.target.value = null;
              }}
              disabled={!selectedPesanan}
            />
            <label htmlFor="file-upload-pelanggan" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 14, background: "white", border: "1.5px solid #e2e8f0", color: "#64748b", cursor: (!selectedPesanan) ? "not-allowed" : "pointer", opacity: (!selectedPesanan) ? 0.5 : 1 }}>
              <Paperclip size={18} />
            </label>

            <input
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              placeholder="Ketik Pesanmu..."
              style={styles.input}
              disabled={!selectedPesanan}
            />

            <button type="submit" disabled={!selectedPesanan || (!pesan.trim() && !gambarInput)} style={{ ...styles.button, opacity: (!selectedPesanan || (!pesan.trim() && !gambarInput)) ? 0.5 : 1, cursor: (!selectedPesanan || (!pesan.trim() && !gambarInput)) ? "not-allowed" : "pointer" }}>
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    borderRadius: 20,
    border: "1px solid #eef2f7",
    overflow: "hidden",
    maxWidth: 1000,
  },
  header: {
    padding: "18px 22px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  adminAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#1e293b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },
  select: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "0 12px",
    outline: "none",
    minWidth: 180,
  },
  chatBox: {
    height: 520,
    overflowY: "auto",
    padding: 24,
    background: "white",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  bubble: {
    maxWidth: "58%",
    padding: "14px 16px",
    fontSize: 14,
    lineHeight: 1.5,
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 40,
  },
  form: {
    padding: "16px 18px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "white",
  },
  input: {
    flex: 1,
    height: 44,
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    padding: "0 14px",
    outline: "none",
  },
  button: {
    height: 44,
    border: "none",
    borderRadius: 14,
    background: "#1e293b",
    color: "white",
    fontWeight: 700,
    padding: "0 22px",
    cursor: "pointer",
  },
};

export default ChatAdmin;