import { useState, useEffect, useCallback } from "react";
import API from "../../api/api";
import { 
  Search, 
  Mail, 
  Phone, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Eye, 
  EyeOff, 
  X, 
  AlertCircle 
} from "lucide-react";

const ROLE_LABEL = {
  admin: "Admin",
  pelanggan: "Pelanggan",
};

const ROLE_COLORS = {
  admin: { bg: "#f3e8ff", text: "#7e22ce", border: "#e9d5ff" },
  pelanggan: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" },
};

const STATUS_LABEL = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  ban: "Banned",
};

const STATUS_COLORS = {
  aktif: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  nonaktif: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
  ban: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
};

function formatTanggal(tgl) {
  if (!tgl) return "-";
  return new Date(tgl).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ManajemenUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Used for edit or delete

  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    telepon: "",
    role: "pelanggan",
    status: "aktif",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notifications
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success'|'error', text: '' }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar user:", err);
      showNotification("error", "Gagal memuat data pengguna dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showNotification = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // Filter & Search Logic
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.nama && u.nama.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchRole = !filterRole || u.role === filterRole;
    const matchStatus = !filterStatus || u.status === filterStatus;

    return matchSearch && matchRole && matchStatus;
  });

  // Metrics (Parity with old HTML + JS app.js stats)
  const totalAdmin = users.filter((u) => u.role === "admin").length;
  const totalPelanggan = users.filter((u) => u.role === "pelanggan").length;
  const totalBanned = users.filter((u) => u.status === "ban" || u.status === "banned").length;

  // Open Modal for Create
  const handleCreateOpen = () => {
    setSelectedUser(null);
    setFormData({
      nama: "",
      email: "",
      password: "",
      telepon: "",
      role: "pelanggan",
      status: "aktif",
    });
    setFormError("");
    setShowPassword(false);
    setFormModalOpen(true);
  };

  // Open Modal for Edit
  const handleEditOpen = (user) => {
    setSelectedUser(user);
    setFormData({
      nama: user.nama || "",
      email: user.email || "",
      password: "", // Leave blank for edit
      telepon: user.telepon || "",
      role: user.role || "pelanggan",
      status: user.status || "aktif",
    });
    setFormError("");
    setShowPassword(false);
    setFormModalOpen(true);
  };

  // Open Modal for Delete (Enforce old admin check rule)
  const handleDeleteOpen = (user) => {
    if (user.role === "admin") {
      showNotification("error", "Admin tidak dapat dihapus!");
      return;
    }
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate name
    if (formData.nama.trim().length < 3) {
      setFormError("Nama minimal harus terdiri dari 3 karakter.");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError("Format email tidak valid.");
      return;
    }

    // Validate password (only mandatory for new user) - Minimum 6 chars for parity with old code
    if (!selectedUser && formData.password.length < 6) {
      setFormError("Password untuk pengguna baru minimal harus 6 karakter.");
      return;
    }

    if (selectedUser && formData.password && formData.password.length < 6) {
      setFormError("Password baru minimal harus 6 karakter.");
      return;
    }

    // Validate telephone
    if (formData.telepon && !/^08\d{8,11}$|^\+?62\d{9,12}$/.test(formData.telepon)) {
      setFormError("Format nomor HP tidak valid (gunakan nomor HP Indonesia aktif).");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedUser) {
        // Edit Mode
        const res = await API.put(`/admin/users/${selectedUser.id_pelanggan}`, formData);
        if (res.data.success) {
          showNotification("success", `Pengguna "${formData.nama}" berhasil diperbarui.`);
          setFormModalOpen(false);
          loadUsers();
        }
      } else {
        // Create Mode
        const res = await API.post("/admin/users", formData);
        if (res.data.success) {
          showNotification("success", `Pengguna "${formData.nama}" berhasil ditambahkan.`);
          setFormModalOpen(false);
          loadUsers();
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan user:", err);
      setFormError(err.response?.data?.message || "Terjadi kesalahan server saat menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await API.delete(`/admin/users/${selectedUser.id_pelanggan}`);
      if (res.data.success) {
        showNotification("success", `Pengguna "${selectedUser.nama}" berhasil dihapus.`);
        setDeleteModalOpen(false);
        loadUsers();
      }
    } catch (err) {
      console.error("Gagal menghapus user:", err);
      showNotification(
        "error",
        err.response?.data?.message || `Gagal menghapus user "${selectedUser.nama}".`
      );
      setDeleteModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "4px 0", maxWidth: 1200, margin: "0 auto" }}>
      
      {/* Dynamic Toast / Notification Banner */}
      {alertMsg && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            background: alertMsg.type === "success" ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${alertMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 12,
            padding: "16px 20px",
            color: alertMsg.type === "success" ? "#15803d" : "#b91c1c",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 380,
          }}
        >
          {alertMsg.type === "error" && <AlertCircle size={18} />}
          <span>{alertMsg.text}</span>
          <button
            onClick={() => setAlertMsg(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginLeft: "auto",
              color: alertMsg.type === "success" ? "#166534" : "#991b1b",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.2 }}>
            Manajemen User
          </h2>
        </div>
        <button
          onClick={handleCreateOpen}
          style={{
            height: 44,
            background: "#1e293b",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "0 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 6px -1px rgba(30, 41, 59, 0.15)",
            transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "#0f172a"}
          onMouseOut={e => e.currentTarget.style.background = "#1e293b"}
        >
          <span style={{ fontSize: 18 }}>+</span>
          <span>Tambahkan Pengguna</span>
        </button>
      </div>

      {/* Summary Cards (Parity with old index.html + app.js stats) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20, marginBottom: 28 }}>
        
        {/* Card 1: Total Admin */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyCenter: "center", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 22, alignSelf: "center" }}>🛡️</span>
          </div>
          <div>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Total Admin</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#000", margin: "2px 0 0" }}>{loading ? "..." : totalAdmin}</h3>
          </div>
        </div>

        {/* Card 2: Total Pelanggan */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyCenter: "center", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 22, alignSelf: "center" }}>👤</span>
          </div>
          <div>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Total Pelanggan</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#000", margin: "2px 0 0" }}>{loading ? "..." : totalPelanggan}</h3>
          </div>
        </div>

        {/* Card 3: Di Banned */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyCenter: "center", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 22, alignSelf: "center" }}>🗑️</span>
          </div>
          <div>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Di Banned</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#000", margin: "2px 0 0" }}>{loading ? "..." : totalBanned}</h3>
          </div>
        </div>

      </div>

      {/* Filters and Table Container */}
      <div style={{ background: "white", borderRadius: 22, overflow: "hidden", border: "1px solid #eef2f7", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        
        {/* Controls Panel / Filter Bar */}
        <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, borderBottom: "1px solid #f1f5f9" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
            
            {/* Search Input with Voice Search button */}
            <div style={{ position: "relative", width: 340 }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  height: 44,
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "0 14px 0 42px",
                  fontSize: 13,
                  outline: "none",
                  color: "#374151",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#1e293b"}
                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              />

              <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8", pointerEvents: "none" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>

            {/* Filter Role (Dropdown match with old design) */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                width: 170,
                height: 44,
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                background: "white",
                padding: "0 14px",
                fontSize: 13,
                color: "#374151",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Peran</option>
              <option value="admin">Admin</option>
              <option value="pelanggan">Pelanggan</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: 170,
                height: 44,
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                background: "white",
                padding: "0 14px",
                fontSize: 13,
                color: "#374151",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="ban">Banned</option>
            </select>

          </div>

        </div>

        {/* User Table (Parity with old index.html columns) */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
            <thead style={{ background: "#ffffff" }}>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Pengguna</th>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Email</th>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Peran</th>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Status</th>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Terakhir Login</th>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Tanggal Pembuatan</th>
                <th style={{ padding: "12px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#000", borderBottom: "1px solid #f1f5f9", background: "white", whiteSpace: "nowrap" }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "50px 20px", fontSize: 13 }}>
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#94a3b8", padding: "50px 20px", fontSize: 13 }}>
                    Tidak ada data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleStyle = ROLE_COLORS[u.role] || { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
                  const statusStyle = STATUS_COLORS[u.status] || { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };

                  return (
                    <tr
                      key={u.id_pelanggan}
                      style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.2s" }}
                      onMouseOver={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    >
                      
                      {/* Pengguna (Name & Icon) */}
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: u.role === "admin" ? "#f3e8ff" : "#e0f2fe",
                              color: u.role === "admin" ? "#7e22ce" : "#0369a1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {(u.nama || "U").charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{u.nama}</span>
                        </div>
                      </td>

                      {/* Email & Telepon */}
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 13, color: "#374151" }}>{u.email}</span>
                          {u.telepon && (
                            <span style={{ fontSize: 11, color: "#64748b" }}>{u.telepon}</span>
                          )}
                        </div>
                      </td>

                      {/* Peran */}
                      <td style={{ padding: "14px 12px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: roleStyle.bg,
                            color: roleStyle.text,
                            border: `1px solid ${roleStyle.border}`,
                            padding: "3px 10px",
                            borderRadius: 20,
                            display: "inline-block",
                          }}
                        >
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 12px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            border: `1px solid ${statusStyle.border}`,
                            padding: "3px 10px",
                            borderRadius: 20,
                            display: "inline-block",
                          }}
                        >
                          {STATUS_LABEL[u.status] || u.status}
                        </span>
                      </td>

                      {/* Terakhir Login */}
                      <td style={{ padding: "14px 12px" }}>
                        <span style={{ fontSize: 13, color: "#475569" }}>
                          {formatTanggal(u.created_at)} {/* Parity representation */}
                        </span>
                      </td>

                      {/* Tanggal Pembuatan */}
                      <td style={{ padding: "14px 12px" }}>
                        <span style={{ fontSize: 13, color: "#475569" }}>
                          {formatTanggal(u.created_at)}
                        </span>
                      </td>

                      {/* Tindakan (Buttons match exact look of old design) */}
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleEditOpen(u)}
                            style={{
                              background: "white",
                              border: "1px solid #d1d5db",
                              color: "black",
                              padding: "8px 10px",
                              borderRadius: 8,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"}
                            onMouseOut={e => e.currentTarget.style.background = "white"}
                            title="Edit User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteOpen(u)}
                            style={{
                              background: "white",
                              border: "1px solid #d1d5db",
                              color: "black",
                              padding: "8px 10px",
                              borderRadius: 8,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={e => e.currentTarget.style.background = "#fee2e2"}
                            onMouseOut={e => e.currentTarget.style.background = "white"}
                            title="Hapus / Ban User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6"/>
                              <path d="M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Table (Parity with old index.html userTableFooter) */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "2px solid #1e293b",
            fontSize: 12,
            color: "#000",
            fontWeight: 500,
            background: "#fff",
          }}
        >
          Menunjukkan {filteredUsers.length} dari {users.length} Pengguna
        </div>

      </div>

      {/* MODAL: CREATE / EDIT USER */}
      {formModalOpen && (
        <div
          onClick={() => setFormModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
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
              borderRadius: 20,
              padding: 28,
              width: "90%",
              maxWidth: 420,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #f1f5f9",
            }}
          >
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {selectedUser ? "Edit Pengguna" : "Tambah Pengguna"}
              </h3>
              <button
                onClick={() => setFormModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Nama</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pengguna"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  style={{
                    padding: "9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    padding: "9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Nomor HP */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Nomor HP</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  style={{
                    padding: "9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!selectedUser}
                    placeholder={selectedUser ? "Kosongkan jika tidak ingin diubah" : "Minimal 6 karakter"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      boxSizing: "border-box",
                      width: "100%",
                      padding: "9px 42px 9px 14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    padding: "9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#374151",
                    outline: "none",
                    background: "white",
                    cursor: "pointer",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="pelanggan">Pelanggan</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Status (Optional but helpful edit field) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    padding: "9px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#374151",
                    outline: "none",
                    background: "white",
                    cursor: "pointer",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                  <option value="ban">Banned</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "none",
                    borderRadius: 8,
                    padding: "11px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"}
                  onMouseOut={e => e.currentTarget.style.background = "#f1f5f9"}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-dark"
                  style={{
                    flex: 1,
                    padding: "11px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModalOpen && selectedUser && (
        <div
          onClick={() => setDeleteModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
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
              borderRadius: 20,
              padding: 28,
              width: "90%",
              maxWidth: 420,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #f1f5f9",
              textAlign: "center",
            }}
          >
            
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: "0 0 10px" }}>
              Hapus Pengguna?
            </h3>
            
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus akun <strong>{selectedUser.nama}</strong> ({selectedUser.email}) secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Menghapus..." : "Hapus Akun"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}