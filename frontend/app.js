// ============================================================
// KONFIGURASI
// ============================================================
var API = 'http://localhost:3000/api';
var TOKEN = localStorage.getItem('sipb_token');
var USER = JSON.parse(localStorage.getItem('sipb_user') || 'null');
var selectedPesananId = null;
var chartPendapatan = null;
var chartStatus = null;
var modePesananAktif = 'pilih';

// ============================================================
// API CALL
// ============================================================
async function apiCall(url, method, body) {
    method = method || 'GET';
    body = body || null;
    var opts = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
    if (body) opts.body = JSON.stringify(body);
    try {
        var res = await fetch(API + url, opts);
        var data = await res.json();
        return data;
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, message: 'Gagal terhubung ke server' };
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function formatRupiah(angka) {
    return 'Rp ' + parseFloat(angka || 0).toLocaleString('id-ID');
}

function formatTanggal(tgl) {
    if (!tgl) return '-';
    return new Date(tgl).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function getBadge(status) {
    var badges = {
        pending: 'badge-pending',
        diproses: 'badge-diproses',
        selesai: 'badge-selesai',
        verifikasi: 'badge-verifikasi',
        aktif: 'badge-aktif',
        nonaktif: 'badge-nonaktif',
        ban: 'badge-ban',
        diterima: 'badge-diterima',
        ditolak: 'badge-ditolak'
    };
    return badges[status] || 'badge-nonaktif';
}

function generateOrderId(idPelanggan, tglDaftar) {
    var tahun = new Date(tglDaftar).getFullYear();
    var id = String(idPelanggan).padStart(4, '0');
    return 'ORD-' + tahun + '-' + id;
}

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    var toastMsg = document.getElementById('toastMsg');
    toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#10b981';
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================================
// LOGIN & LOGOUT
// ============================================================
function quickLogin(email, pass) {
    document.getElementById('inEmail').value = email;
    document.getElementById('inPass').value = pass;
    doLogin();
}

async function doLogin() {
    var email = document.getElementById('inEmail').value.trim();
    var pass = document.getElementById('inPass').value.trim();
    var errMsg = document.getElementById('errMsg');

    if (!email || !pass) {
        errMsg.textContent = 'Email dan password wajib diisi!';
        errMsg.style.display = 'block';
        return;
    }

    var res = await apiCall('/auth/login', 'POST', {
        email: email,
        password: pass
    });

    if (res.success) {
        TOKEN = res.token;
        USER = res.user;
        localStorage.setItem('sipb_token', TOKEN);
        localStorage.setItem('sipb_user', JSON.stringify(USER));
        errMsg.style.display = 'none';
        initApp();
    } else {
        errMsg.textContent = res.message || 'Login gagal!';
        errMsg.style.display = 'block';
    }
}

function doLogout() {
    localStorage.removeItem('sipb_token');
    localStorage.removeItem('sipb_user');
    TOKEN = null;
    USER = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    showToast('Berhasil keluar dari sistem');
}

// ============================================================
// INIT APP
// ============================================================
function initApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    var nama = USER.nama;
    var role = USER.role;
    var avatar = nama.charAt(0).toUpperCase();

    document.getElementById('sbAvatar').textContent = avatar;
    document.getElementById('sbName').textContent = nama;
    document.getElementById('sbRole').textContent = role === 'admin' ? 'Administrator' : 'Pelanggan';
    document.getElementById('hdAvatar').textContent = avatar;
    document.getElementById('hdName').textContent = nama;
    document.getElementById('hdRole').textContent = role === 'admin' ? 'Administrator' : 'Pelanggan';

    buildNav(role);

    if (role === 'admin') {
        goPage('dashboard');
    } else {
        goPage('beranda');
    }
}

// ============================================================
// BUILD NAV
// ============================================================
function buildNav(role) {
    var nav = document.getElementById('navLinks');

    var adminMenus = [
        { id: 'dashboard', icon: '🏠', label: 'Beranda' },
        { id: 'kelola-pesanan', icon: '📋', label: 'Daftar Pesanan' },
        { id: 'kelola-pelanggan', icon: '👥', label: 'Daftar Pelanggan' },
        { id: 'laporan', icon: '📊', label: 'Laporan Keuangan' },
        { id: 'koordinasi', icon: '💬', label: 'Koordinasi Harga' },
        { id: 'manajemen-user', icon: '👤', label: 'Manajemen User' },
        { id: 'pengaturan', icon: '⚙️', label: 'Pengaturan' }
    ];

    var pelangganMenus = [
        { id: 'beranda', icon: '🏠', label: 'Beranda' },
        { id: 'pesanan-saya', icon: '🛒', label: 'Pesanan Saya' },
        { id: 'riwayat', icon: '📜', label: 'Riwayat Transaksi' },
        { id: 'profil', icon: '👤', label: 'Profil Saya' },
        { id: 'chat', icon: '💬', label: 'Chat Admin' }
    ];

    var menus = role === 'admin' ? adminMenus : pelangganMenus;

    nav.innerHTML = menus.map(function(m) {
        return '<div class="nav-item" id="nav-' + m.id + '" onclick="goPage(\'' + m.id + '\')">' +
            '<span style="font-size:15px;">' + m.icon + '</span>' +
            '<span>' + m.label + '</span>' +
            '</div>';
    }).join('');
}

// ============================================================
// NAVIGASI
// ============================================================
function goPage(pageId) {
    document.querySelectorAll('.page').forEach(function(p) {
        p.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });

    var page = document.getElementById('pg-' + pageId);
    var nav = document.getElementById('nav-' + pageId);

    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');

    var titles = {
        'dashboard': ['Order Barang', 'Beranda'],
        'kelola-pesanan': ['Daftar Pesanan', 'Beranda'],
        'kelola-pelanggan': ['Daftar Pelanggan', 'Beranda'],
        'laporan': ['Laporan Keuangan', 'Beranda'],
        'koordinasi': ['Koordinasi Harga', 'Beranda'],
        'manajemen-user': ['Manajemen User', 'Beranda'],
        'pengaturan': ['Pengaturan', 'Beranda'],
        'beranda': ['Beranda', 'Pelanggan'],
        'pesanan-saya': ['Pesanan Saya', 'Pelanggan'],
        'riwayat': ['Riwayat Transaksi', 'Pelanggan'],
        'chat': ['Chat Admin', 'Pelanggan'],
        'profil': ['Profil Saya', 'Pelanggan']
    };

    var info = titles[pageId] || [pageId, ''];
    document.getElementById('pgTitle').textContent = info[0];
    document.getElementById('pgSub').textContent = info[1] + ' / ' + info[0];

    loadPageData(pageId);
}

// ============================================================
// LOAD DATA PER HALAMAN
// ============================================================
function loadPageData(pageId) {
    if (pageId === 'dashboard') loadDashboard();
    else if (pageId === 'kelola-pesanan') loadPesananAdmin();
    else if (pageId === 'kelola-pelanggan') loadPelanggan();
    else if (pageId === 'laporan') loadLaporan();
    else if (pageId === 'koordinasi') loadKoordinasi();
    else if (pageId === 'manajemen-user') loadManajemenUser();
    else if (pageId === 'pengaturan') loadPengaturan();
    else if (pageId === 'beranda') loadBeranda();
    else if (pageId === 'pesanan-saya') loadPesananSaya();
    else if (pageId === 'riwayat') loadRiwayat();
    else if (pageId === 'chat') loadChatPelanggan();
    else if (pageId === 'profil') loadProfil();
}

// ============================================================
// DASHBOARD ADMIN
// ============================================================
async function loadDashboard() {
    var res = await apiCall('/admin/dashboard');
    if (!res.success) return;
    var d = res.data;

    var elTotal = document.getElementById('statTotalPesanan');
    var elVerifikasi = document.getElementById('statVerifikasi');
    var elPendapatan = document.getElementById('statPendapatan');
    var elBadge = document.getElementById('statPendingBadge');

    if (elTotal) elTotal.textContent = d.total_pesanan;
    if (elPendapatan) elPendapatan.textContent = formatRupiah(d.total_pendapatan);

    var verifikasi = 0;
    var pending = 0;
    d.per_status.forEach(function(s) {
        if (s.status === 'verifikasi') verifikasi = parseInt(s.total);
        if (s.status === 'pending') pending = parseInt(s.total);
    });
    if (elVerifikasi) elVerifikasi.textContent = verifikasi;
    if (elBadge) elBadge.textContent = (verifikasi + pending) + ' tertunda';

    var namaBulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    var sekarang = new Date();
    var bulan6Terakhir = [];
    for (var i = 5; i >= 0; i--) {
        var tgl = new Date(sekarang.getFullYear(), sekarang.getMonth() - i, 1);
        bulan6Terakhir.push({
            bulan: tgl.getMonth() + 1,
            tahun: tgl.getFullYear(),
            label: namaBulan[tgl.getMonth()]
        });
    }

    var labels = bulan6Terakhir.map(function(b) { return b.label; });
    var values = bulan6Terakhir.map(function(b) {
        var found = null;
        if (d.per_bulan && d.per_bulan.length > 0) {
            d.per_bulan.forEach(function(item) {
                if (parseInt(item.bulan) === b.bulan && parseInt(item.tahun) === b.tahun) {
                    found = item;
                }
            });
        }
        return found ? parseFloat(found.total_pendapatan) || 0 : 0;
    });

    if (chartPendapatan) chartPendapatan.destroy();
    var ctx1 = document.getElementById('chartPendapatan');
    if (ctx1) {
        chartPendapatan = new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pendapatan',
                    data: values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return 'Rp ' + ctx.parsed.y.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            maxTicksLimit: 5,
                            callback: function(v) {
                                if (v >= 1000000) return (v/1000000).toFixed(1) + 'Jt';
                                if (v >= 1000) return (v/1000).toFixed(0) + 'K';
                                return v;
                            },
                            font: { size: 10 },
                            color: '#94a3b8'
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: '#64748b' },
                        border: { display: false }
                    }
                }
            }
        });
    }

    if (chartStatus) chartStatus.destroy();
    var ctx2 = document.getElementById('chartStatus');
    if (ctx2) {
        var maxValue = Math.max.apply(null, values);
        chartStatus = new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pendapatan',
                    data: values,
                    backgroundColor: values.map(function(v) {
                        return v === maxValue && maxValue > 0
                            ? 'rgba(99,102,241,0.85)'
                            : 'rgba(99,102,241,0.3)';
                    }),
                    borderRadius: 5,
                    borderSkipped: false,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return 'Rp ' + ctx.parsed.y.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            maxTicksLimit: 5,
                            callback: function(v) {
                                if (v >= 1000000) return (v/1000000).toFixed(1) + 'Jt';
                                if (v >= 1000) return (v/1000).toFixed(0) + 'K';
                                return v;
                            },
                            font: { size: 10 },
                            color: '#94a3b8'
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: '#64748b' },
                        border: { display: false }
                    }
                }
            }
        });
    }

    var tb = document.getElementById('tbDashboard');
    if (!tb) return;

    if (!d.pesanan_terbaru || d.pesanan_terbaru.length === 0) {
        tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:30px;">Belum ada pesanan</td></tr>';
        return;
    }

    var statusLabel = {
        pending: 'Menunggu Verifikasi',
        diproses: 'Sedang Diproses',
        selesai: 'Terverifikasi',
        verifikasi: 'Perlu Verifikasi'
    };

    var statusColor = {
        pending: '#f59e0b',
        diproses: '#3b82f6',
        selesai: '#10b981',
        verifikasi: '#8b5cf6'
    };

    tb.innerHTML = d.pesanan_terbaru.map(function(p) {
        var orderId = generateOrderId(p.id_pelanggan, p.tanggal_pesan);
        return '<tr style="border-bottom:1px solid #f8fafc;">' +
            '<td style="padding:13px 20px;font-size:13px;color:#374151;">' + orderId + '</td>' +
            '<td style="padding:13px 20px;font-size:13px;color:#374151;">' + p.nama_pelanggan + '</td>' +
            '<td style="padding:13px 20px;font-size:13px;color:#374151;">' + formatRupiah(p.total_harga) + '</td>' +
            '<td style="padding:13px 20px;">' +
            '<span style="font-size:13px;font-weight:600;color:' + (statusColor[p.status] || '#64748b') + ';">' +
            (statusLabel[p.status] || p.status) + '</span>' +
            '</td>' +
            '</tr>';
    }).join('');
}

// ============================================================
// KELOLA PESANAN ADMIN
// ============================================================
async function loadPesananAdmin(search, status) {
    search = search || '';
    status = status || '';
    var url = '/admin/pesanan?';
    if (search) url += 'search=' + encodeURIComponent(search) + '&';
    if (status) url += 'status=' + status;

    var res = await apiCall(url);
    if (!res.success) return;

    var counter = document.getElementById('counterPesanan');
    if (counter) counter.textContent = res.data.length + ' Pesanan';

    var tb = document.getElementById('tbKelolaPesanan');
    if (!tb) return;

    if (res.data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:40px;">Tidak ada pesanan ditemukan</td></tr>';
        return;
    }

    var statusLabel = {
        pending: 'Menunggu Verifikasi',
        diproses: 'Sedang Diproses',
        selesai: 'Terverifikasi',
        verifikasi: 'Menunggu Verifikasi'
    };

    var statusColor = {
        pending: '#f59e0b',
        diproses: '#3b82f6',
        selesai: '#10b981',
        verifikasi: '#f59e0b'
    };

    tb.innerHTML = res.data.map(function(p) {
        var orderId = generateOrderId(p.id_pelanggan, p.tanggal_pesan);
        var dp = parseFloat(p.total_harga) / 2;
        var tgl = p.tanggal_pesan ? new Date(p.tanggal_pesan).toLocaleDateString('id-ID', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }) : '-';

        return '<tr style="border-bottom:1px solid #f8fafc;">' +
            '<td style="padding:13px 20px;"><span style="font-size:13px;font-weight:600;color:#1e293b;">' + orderId + '</span></td>' +
            '<td style="padding:13px 20px;"><span style="font-size:13px;color:#374151;">' + p.nama_pelanggan + '</span></td>' +
            '<td style="padding:13px 20px;"><span style="font-size:13px;font-weight:600;color:#1e293b;">' + formatRupiah(p.total_harga) + '</span></td>' +
            '<td style="padding:13px 20px;"><span style="font-size:13px;color:#374151;">' + formatRupiah(dp) + '</span></td>' +
            '<td style="padding:13px 20px;"><span style="font-size:13px;color:#374151;">' + tgl + '</span></td>' +
            '<td style="padding:13px 20px;"><span style="font-size:13px;font-weight:500;color:' + (statusColor[p.status] || '#64748b') + ';">' + (statusLabel[p.status] || p.status) + '</span></td>' +
            '<td style="padding:13px 20px;">' +
            '<button onclick="showModalStatus(' + p.id_pesanan + ',\'' + p.status + '\')" ' +
            'style="background:white;border:2px solid #1e293b;color:#1e293b;border-radius:8px;padding:6px 20px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;white-space:nowrap;" ' +
            'onmouseover="this.style.background=\'#1e293b\';this.style.color=\'white\'" ' +
            'onmouseout="this.style.background=\'white\';this.style.color=\'#1e293b\'">Verifikasi</button>' +
            '</td>' +
            '</tr>';
    }).join('');
}

async function showModalStatus(id, statusSaat) {
    selectedPesananId = id;
    var html = '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div><label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px;">Status Baru</label>' +
        '<select class="input" id="statusBaru">' +
        '<option value="pending"' + (statusSaat === 'pending' ? ' selected' : '') + '>Pending</option>' +
        '<option value="diproses"' + (statusSaat === 'diproses' ? ' selected' : '') + '>Diproses</option>' +
        '<option value="verifikasi"' + (statusSaat === 'verifikasi' ? ' selected' : '') + '>Verifikasi</option>' +
        '<option value="selesai"' + (statusSaat === 'selesai' ? ' selected' : '') + '>Selesai</option>' +
        '</select></div>' +
        '<div><label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:6px;">Catatan Admin</label>' +
        '<textarea class="input" id="catatanAdmin" rows="3" placeholder="Tambahkan catatan..."></textarea></div>' +
        '<button onclick="updateStatusPesanan()" class="btn btn-dark" style="width:100%;padding:12px;">Simpan Status</button>' +
        '</div>';
    document.getElementById('modalStatusContent').innerHTML = html;
    openModal('modalStatus');
}

async function updateStatusPesanan() {
    var status = document.getElementById('statusBaru').value;
    var catatan = document.getElementById('catatanAdmin').value;
    var res = await apiCall('/admin/pesanan/' + selectedPesananId + '/status', 'PUT', {
        status: status,
        catatan_admin: catatan
    });
    if (res.success) {
        closeModal('modalStatus');
        showToast('Status pesanan berhasil diubah!');
        loadPesananAdmin();
    } else {
        showToast(res.message, 'error');
    }
}

// ============================================================
// KELOLA PELANGGAN
// ============================================================
async function loadPelanggan(search) {
    search = search || '';
    var url = '/admin/pelanggan?';
    if (search) url += 'search=' + encodeURIComponent(search);

    var res = await apiCall(url);
    if (!res.success) return;

    var counter = document.getElementById('counterPelanggan');
    if (counter) counter.textContent = res.data.length + ' Pelanggan';

    var tb = document.getElementById('tbPelanggan');
    if (!tb) return;

    if (res.data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:40px;">Tidak ada pelanggan ditemukan</td></tr>';
        return;
    }

    tb.innerHTML = res.data.map(function(p) {
        var orderId = generateOrderId(p.id_pelanggan, p.created_at);

        var tglLogin = p.updated_at
            ? new Date(p.updated_at).toISOString().split('T')[0]
            : new Date(p.created_at).toISOString().split('T')[0];

        var statusWarna = { aktif: '#10b981', nonaktif: '#94a3b8', ban: '#ef4444' };
        var statusLabel = { aktif: 'Active', nonaktif: 'Nonaktif', ban: 'Banned' };

        return '<tr style="border-bottom:1px solid #f8fafc;">' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;font-weight:600;color:#1e293b;">' + orderId + '</span></td>' +
            '<td style="padding:14px 20px;">' +
            '<div style="display:flex;flex-direction:column;gap:4px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
            '<svg style="width:13px;height:13px;flex-shrink:0;" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
            '<span style="font-size:12px;color:#374151;">' + (p.email || '-') + '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
            '<svg style="width:13px;height:13px;flex-shrink:0;" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.09 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>' +
            '<span style="font-size:12px;color:#374151;">' + (p.telepon || '-') + '</span>' +
            '</div></div></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + (p.total_pesanan || 0) + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;font-weight:600;color:#1e293b;">' + formatRupiah(p.total_belanja || 0) + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:12px;color:#374151;">' + tglLogin + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;font-weight:600;color:' + (statusWarna[p.status] || '#64748b') + ';">' + (statusLabel[p.status] || p.status) + '</span></td>' +
            '<td style="padding:14px 20px;">' +
            '<button onclick="lihatPesananPelanggan(' + p.id_pelanggan + ',\'' + p.nama + '\')" ' +
            'style="background:white;border:2px solid #1e293b;color:#1e293b;border-radius:8px;padding:6px 16px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;white-space:nowrap;" ' +
            'onmouseover="this.style.background=\'#1e293b\';this.style.color=\'white\'" ' +
            'onmouseout="this.style.background=\'white\';this.style.color=\'#1e293b\'">Lihat Pesanan</button>' +
            '</td></tr>';
    }).join('');
}

async function lihatPesananPelanggan(idPelanggan, namaPelanggan) {
    var res = await apiCall('/admin/pesanan?search=' + encodeURIComponent(namaPelanggan));
    if (!res.success) return;

    var pesanan = res.data.filter(function(p) {
        return p.id_pelanggan === idPelanggan;
    });

    var statusLabel = {
        pending: 'Menunggu Verifikasi',
        diproses: 'Sedang Diproses',
        selesai: 'Terverifikasi',
        verifikasi: 'Menunggu Verifikasi'
    };

    var statusColor = {
        pending: '#f59e0b',
        diproses: '#3b82f6',
        selesai: '#10b981',
        verifikasi: '#f59e0b'
    };

    var pesananHtml = pesanan.length > 0
        ? pesanan.map(function(p) {
            var orderId = generateOrderId(p.id_pelanggan, p.tanggal_pesan);
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f8fafc;border-radius:8px;margin-bottom:8px;">' +
                '<div><div style="font-weight:700;font-size:13px;color:#1e293b;">' + orderId + '</div>' +
                '<div style="font-size:11px;color:#94a3b8;">' + formatTanggal(p.tanggal_pesan) + '</div></div>' +
                '<div style="text-align:right;"><div style="font-weight:700;font-size:13px;">' + formatRupiah(p.total_harga) + '</div>' +
                '<div style="font-size:11px;font-weight:600;color:' + (statusColor[p.status] || '#64748b') + ';">' + (statusLabel[p.status] || p.status) + '</div></div>' +
                '</div>';
        }).join('')
        : '<div style="text-align:center;color:#94a3b8;padding:20px;font-size:13px;">Belum ada pesanan</div>';

    document.getElementById('modalDetailContent').innerHTML =
        '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
        '<div style="width:44px;height:44px;border-radius:12px;background:#1e293b;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px;">' + namaPelanggan.charAt(0).toUpperCase() + '</div>' +
        '<div><div style="font-weight:700;font-size:15px;color:#1e293b;">' + namaPelanggan + '</div>' +
        '<div style="font-size:12px;color:#94a3b8;">' + pesanan.length + ' Total Pesanan</div></div></div>' +
        '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">Riwayat Pesanan:</div>' +
        pesananHtml + '</div>' +
        '<button onclick="closeModal(\'modalDetail\')" style="width:100%;background:#f1f5f9;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;color:#374151;cursor:pointer;">Tutup</button>';

    openModal('modalDetail');
}

// ============================================================
// LAPORAN KEUANGAN
// ============================================================
async function loadLaporan() {
    var res = await apiCall('/admin/laporan?tahun=2024');
    if (!res.success) return;

    var ytd = res.summary ? res.summary.total_pendapatan : 0;
    var elYTD = document.getElementById('laporanYTD');
    if (elYTD) elYTD.textContent = formatRupiah(ytd);

    var bulanIni = new Date().getMonth() + 1;
    var generateBulanIni = res.data.filter(function(l) {
        return new Date(l.tanggal_pesan).getMonth() + 1 === bulanIni;
    }).length;

    var elGen = document.getElementById('laporanGenerate');
    if (elGen) elGen.textContent = generateBulanIni;

    var resPesanan = await apiCall('/admin/pesanan?status=pending');
    if (resPesanan.success) {
        var nunggak = resPesanan.data.length;
        var totalNunggak = resPesanan.data.reduce(function(sum, p) {
            return sum + parseFloat(p.total_harga || 0);
        }, 0);
        var elNunggak = document.getElementById('laporanNunggak');
        var elNunggakInfo = document.getElementById('laporanNunggakInfo');
        if (elNunggak) elNunggak.textContent = formatRupiah(totalNunggak);
        if (elNunggakInfo) elNunggakInfo.textContent = nunggak + ' Pesanan belum dibayar';
    }

    var tb = document.getElementById('tbLaporan');
    if (!tb) return;

    if (res.data.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px;">Belum ada laporan</td></tr>';
        return;
    }

    var groupBulan = {};
    res.data.forEach(function(l) {
        var tgl = new Date(l.tanggal_pesan);
        var key = tgl.getFullYear() + '-' + String(tgl.getMonth() + 1).padStart(2, '0');
        var namaBln = tgl.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        if (!groupBulan[key]) {
            groupBulan[key] = { key: key, nama: namaBln, total: 0, tipe: 'Ringkasan Penjualan', tgl_buat: l.tanggal_pesan };
        }
        groupBulan[key].total += parseFloat(l.total_harga || 0);
    });

    var rows = Object.values(groupBulan);
    tb.innerHTML = rows.map(function(l) {
        var tglBuat = new Date(l.tgl_buat).toISOString().split('T')[0];
        var namaLaporan = 'Ringkasan Penjualan ' + l.nama;
        return '<tr style="border-bottom:1px solid #f8fafc;">' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + namaLaporan + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + l.nama + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + l.tipe + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;font-weight:600;color:#1e293b;">' + formatRupiah(l.total) + '</span></td>' +
            '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + tglBuat + '</span></td>' +
            '<td style="padding:14px 20px;">' +
            '<div style="display:flex;gap:6px;">' +
            '<button onclick="exportLaporan(\'word\',\'' + namaLaporan + '\')" style="background:#2563eb;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;">Word</button>' +
            '<button onclick="exportLaporan(\'excel\',\'' + namaLaporan + '\')" style="background:#16a34a;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;">Excel</button>' +
            '</div></td>' +
            '</tr>';
    }).join('');
}

function buatLaporan() {
    var tipe = document.getElementById('tipeLaporan').value;
    var mulai = document.getElementById('tglMulai').value;
    var selesai = document.getElementById('tglSelesai').value;

    if (!mulai || !selesai) {
        showToast('Waktu mulai dan selesai wajib diisi!', 'error');
        return;
    }
    if (new Date(mulai) > new Date(selesai)) {
        showToast('Waktu mulai tidak boleh lebih dari waktu selesai!', 'error');
        return;
    }

    var tipeLabel = { ringkasan: 'Ringkasan Penjualan', detail: 'Detail Transaksi', pelanggan: 'Per Pelanggan', bulanan: 'Bulanan' };
    var namaLaporan = (tipeLabel[tipe] || tipe) + ' ' +
        new Date(mulai).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    var tb = document.getElementById('tbLaporan');
    var newRow = '<tr style="border-bottom:1px solid #f8fafc;background:#f0fdf4;">' +
        '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + namaLaporan + '</span></td>' +
        '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + new Date(mulai).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + '</span></td>' +
        '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + (tipeLabel[tipe] || tipe) + '</span></td>' +
        '<td style="padding:14px 20px;"><span style="font-size:13px;font-weight:600;color:#1e293b;">-</span></td>' +
        '<td style="padding:14px 20px;"><span style="font-size:13px;color:#374151;">' + new Date().toISOString().split('T')[0] + '</span></td>' +
        '<td style="padding:14px 20px;"><div style="display:flex;gap:6px;">' +
        '<button onclick="exportLaporan(\'word\',\'' + namaLaporan + '\')" style="background:#2563eb;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;">Word</button>' +
        '<button onclick="exportLaporan(\'excel\',\'' + namaLaporan + '\')" style="background:#16a34a;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;">Excel</button>' +
        '</div></td></tr>';

    var emptyRow = tb.querySelector('td[colspan="6"]');
    if (emptyRow) {
        tb.innerHTML = newRow;
    } else {
        tb.insertAdjacentHTML('afterbegin', newRow);
    }

    showToast('Laporan berhasil dibuat!');
    var elGen = document.getElementById('laporanGenerate');
    if (elGen) elGen.textContent = parseInt(elGen.textContent || 0) + 1;
}

function exportLaporan(tipe, nama) {
    showToast('Mengexport ' + nama + ' ke ' + tipe.toUpperCase() + '...');
}

// ============================================================
// KOORDINASI HARGA
// ============================================================
async function loadKoordinasi() {
    var tgl = new Date();
    tgl.setDate(tgl.getDate() + 7);
    var tglDefault = tgl.toISOString().split('T')[0];
    var inputJatuhTempo = document.getElementById('koordJatuhTempo');
    if (inputJatuhTempo) inputJatuhTempo.value = tglDefault;
    resetFormKoordinasi();
}

async function cariPesananKoord(orderId) {
    if (!orderId || orderId.length < 3) {
        var elNama = document.getElementById('koordNamaPelanggan');
        if (elNama) elNama.value = '';
        selectedPesananId = null;
        return;
    }

    var res = await apiCall('/admin/pesanan');
    if (!res.success || res.data.length === 0) return;

    var found = res.data.find(function(p) {
        var genId = generateOrderId(p.id_pelanggan, p.tanggal_pesan);
        return genId.toLowerCase() === orderId.toLowerCase();
    });

    if (!found) {
        found = res.data.find(function(p) {
            var genId = generateOrderId(p.id_pelanggan, p.tanggal_pesan);
            return genId.toLowerCase().includes(orderId.toLowerCase());
        });
    }

    if (found) {
        selectedPesananId = found.id_pesanan;
        var elNama = document.getElementById('koordNamaPelanggan');
        if (elNama) elNama.value = found.nama_pelanggan;

        var elHarga = document.getElementById('koordHarga');
        if (elHarga && !elHarga.value) elHarga.value = found.total_harga;

        var elDP = document.getElementById('koordDP');
        if (elDP && !elDP.value) elDP.value = (parseFloat(found.total_harga) / 2).toFixed(0);

        hitungKoordinasi();
        showToast('Pesanan ' + generateOrderId(found.id_pelanggan, found.tanggal_pesan) + ' ditemukan!');
    } else {
        var elNama2 = document.getElementById('koordNamaPelanggan');
        if (elNama2) elNama2.value = '';
        selectedPesananId = null;
    }
}

function hitungKoordinasi() {
    var harga = parseFloat(document.getElementById('koordHarga').value) || 0;
    var dp = parseFloat(document.getElementById('koordDP').value) || 0;
    var sisa = harga - dp;
    var persen = harga > 0 ? ((dp / harga) * 100).toFixed(0) : 0;

    var elSisaInput = document.getElementById('koordSisa');
    if (elSisaInput) elSisaInput.value = sisa.toLocaleString('id-ID');

    var elTotal = document.getElementById('ringkasanTotal');
    var elDP = document.getElementById('ringkasanDP');
    var elDPPersen = document.getElementById('ringkasanDPPersen');
    var elSisa = document.getElementById('ringkasanSisa');

    if (elTotal) elTotal.textContent = formatRupiah(harga);
    if (elDP) elDP.textContent = formatRupiah(dp);
    if (elDPPersen) elDPPersen.textContent = '(' + persen + '%)';
    if (elSisa) {
        elSisa.textContent = formatRupiah(sisa);
        elSisa.style.color = sisa > 0 ? '#ef4444' : '#10b981';
    }
}

async function simpanKoordinasi() {
    var orderId = document.getElementById('koordOrderId').value.trim();
    var namaPelanggan = document.getElementById('koordNamaPelanggan').value.trim();
    var harga = parseFloat(document.getElementById('koordHarga').value) || 0;
    var dp = parseFloat(document.getElementById('koordDP').value) || 0;
    var jatuhTempo = document.getElementById('koordJatuhTempo').value;
    var catatan = document.getElementById('koordCatatan').value.trim();

    if (!orderId) { showToast('Order ID wajib diisi!', 'error'); return; }
    if (!namaPelanggan) { showToast('Order ID tidak ditemukan!', 'error'); return; }
    if (harga <= 0) { showToast('Harga yang disepakati wajib diisi!', 'error'); return; }
    if (dp > harga) { showToast('Total DP tidak boleh lebih dari harga!', 'error'); return; }
    if (!jatuhTempo) { showToast('Tanggal jatuh tempo wajib diisi!', 'error'); return; }

    if (selectedPesananId) {
        var catatanAdmin = 'Harga disepakati: ' + formatRupiah(harga) +
            ' | DP: ' + formatRupiah(dp) +
            ' | Jatuh Tempo: ' + jatuhTempo +
            (catatan ? ' | Catatan: ' + catatan : '');

        var res = await apiCall('/admin/pesanan/' + selectedPesananId + '/status', 'PUT', {
            status: 'diproses',
            catatan_admin: catatanAdmin
        });

        if (res.success) {
            showToast('Koordinasi harga berhasil disimpan!');
        } else {
            showToast(res.message || 'Gagal menyimpan!', 'error');
        }
    } else {
        showToast('Koordinasi harga berhasil disimpan!');
    }
}

function hapusKoordinasi() {
    resetFormKoordinasi();
    showToast('Form berhasil dikosongkan!');
}

function resetFormKoordinasi() {
    var fields = ['koordOrderId', 'koordNamaPelanggan', 'koordHarga', 'koordDP', 'koordCatatan', 'koordSisa'];
    fields.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });

    var ringkasan = ['ringkasanTotal', 'ringkasanDP', 'ringkasanSisa'];
    ringkasan.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = 'Rp 0';
    });

    var elPersen = document.getElementById('ringkasanDPPersen');
    if (elPersen) elPersen.textContent = '(0%)';

    var elSisa = document.getElementById('ringkasanSisa');
    if (elSisa) elSisa.style.color = '#ef4444';

    var tgl = new Date();
    tgl.setDate(tgl.getDate() + 7);
    var inputJatuhTempo = document.getElementById('koordJatuhTempo');
    if (inputJatuhTempo) inputJatuhTempo.value = tgl.toISOString().split('T')[0];

    selectedPesananId = null;
}

// ============================================================
// MANAJEMEN USER
// ============================================================
async function loadManajemenUser(search, roleFilter) {
    search = search || '';
    roleFilter = roleFilter || '';

    var users = [];

    // Ambil data pelanggan
    var resPelanggan = await apiCall('/admin/pelanggan');

    if (resPelanggan.success && Array.isArray(resPelanggan.data)) {
        users = resPelanggan.data.map(function(p) {
            return {
                id: p.id_pelanggan,
                nama: p.nama,
                email: p.email || '-',
                role: 'pelanggan',
                status: p.status || 'aktif',
                last_login: p.updated_at || p.created_at,
                created_at: p.created_at
            };
        });
    }

    // Tambahkan admin yang sedang login
    users.unshift({
        id: 1,
        nama: USER.nama || 'Admin Utama',
        email: USER.email || 'admin@sipb.com',
        role: 'admin',
        status: 'aktif',
        last_login: new Date(),
        created_at: new Date()
    });

    var semuaUser = users;

    if (search) {
        users = users.filter(function(u) {
            return u.nama.toLowerCase().includes(search.toLowerCase()) ||
                   u.email.toLowerCase().includes(search.toLowerCase());
        });
    }

    if (roleFilter) {
        users = users.filter(function(u) {
            return u.role === roleFilter;
        });
    }

    var totalAdmin = semuaUser.filter(function(u) {
        return u.role === 'admin';
    }).length;

    var totalPelanggan = semuaUser.filter(function(u) {
        return u.role === 'pelanggan';
    }).length;

    var totalBanned = semuaUser.filter(function(u) {
        return u.status === 'ban' || u.status === 'banned';
    }).length;

    var userStats = document.getElementById('userStats');
    if (userStats) {
        userStats.innerHTML =
            '<div class="card" style="height:170px;display:flex;flex-direction:column;justify-content:center;">' +
                '<div style="width:60px;height:60px;background:#dbeafe;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">🛡️</div>' +
                '<div style="font-size:22px;font-weight:600;color:#64748b;margin-bottom:12px;">Total Admin</div>' +
                '<div style="font-size:20px;font-weight:700;color:#000;">' + totalAdmin + '</div>' +
            '</div>' +
            '<div class="card" style="height:170px;display:flex;flex-direction:column;justify-content:center;">' +
                '<div style="width:60px;height:60px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">👤</div>' +
                '<div style="font-size:22px;font-weight:600;color:#64748b;margin-bottom:12px;">Total Pelanggan</div>' +
                '<div style="font-size:20px;font-weight:700;color:#000;">' + totalPelanggan + '</div>' +
            '</div>' +
            '<div class="card" style="height:170px;display:flex;flex-direction:column;justify-content:center;">' +
                '<div style="width:60px;height:60px;background:#fee2e2;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">🗑️</div>' +
                '<div style="font-size:22px;font-weight:600;color:#64748b;margin-bottom:12px;">Di Banned</div>' +
                '<div style="font-size:20px;font-weight:700;color:#000;">' + totalBanned + '</div>' +
            '</div>';
    }

    var footer = document.getElementById('userTableFooter');
    if (footer) {
        footer.textContent = 'Menunjukkan ' + users.length + ' dari ' + semuaUser.length + ' Pengguna';
    }

    var tb = document.getElementById('tbUser');
    if (!tb) return;

    if (users.length === 0) {
        tb.innerHTML =
            '<tr><td colspan="7" style="padding:18px;color:#000;">Menunjukkan 0 dari 0 Pengguna</td></tr>';
        return;
    }

    tb.innerHTML = users.map(function(u) {
        return '<tr>' +
            '<td>' + u.nama + '</td>' +
            '<td>' + u.email + '</td>' +
            '<td>' + u.role + '</td>' +
            '<td>' + u.status + '</td>' +
            '<td>' + formatTanggal(u.last_login) + '</td>' +
            '<td>' + formatTanggal(u.created_at) + '</td>' +
            '<td>' +
               '<button onclick="editUser(' + u.id + ')" class="btn btn-gray" style="padding:8px 10px;background:white;border:1px solid #d1d5db;">' +
'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="black" stroke-width="2" viewBox="0 0 24 24">' +
'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>' +
'</svg>' +
'</button> ' +

'<button onclick="hapusUser(' + u.id + ', \'' + u.role + '\')" class="btn btn-red" style="padding:8px 10px;background:white;border:1px solid #d1d5db;color:black;">' +
'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="black" stroke-width="2" viewBox="0 0 24 24">' +
'<polyline points="3 6 5 6 21 6"/>' +
'<path d="M19 6l-1 14H6L5 6"/>' +
'<path d="M10 11v6"/>' +
'<path d="M14 11v6"/>' +
'<path d="M9 6V4h6v2"/>' +
'</svg>' +
'</button>'
            '</td>' +
        '</tr>';
    }).join('');
}

function showModalTambahUser() {
    document.getElementById('newUserNama').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'pelanggan';
    openModal('modalTambahUser');
}

async function tambahUser() {
    var nama = document.getElementById('newUserNama').value.trim();
    var email = document.getElementById('newUserEmail').value.trim();
    var password = document.getElementById('newUserPassword').value.trim();
    var role = document.getElementById('newUserRole').value;

    if (!nama || !email || !password) {
        showToast('Nama, email, dan password wajib diisi!', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password minimal 6 karakter!', 'error');
        return;
    }

    // Register user pelanggan via API auth/register
    // Jika role admin, backend sederhana ini tetap register pelanggan,
    // role admin bisa disesuaikan manual di database jika dibutuhkan.
    var res = await apiCall('/auth/register', 'POST', {
        nama: nama,
        email: email,
        password: password,
        telepon: '',
        alamat: ''
    });

    if (res.success) {
        closeModal('modalTambahUser');
        showToast('Pengguna berhasil ditambahkan!');
        loadManajemenUser();
    } else {
        showToast(res.message || 'Gagal menambahkan pengguna!', 'error');
    }
}

function editUser(id) {
    showToast('Fitur edit user ID ' + id + ' siap dikembangkan.');
}

async function hapusUser(id, role) {
    if (role === 'admin') {
        showToast('Admin tidak dapat dihapus!', 'error');
        return;
    }

    var yakin = confirm('Yakin ingin membanned user ini?');
    if (!yakin) return;

    var res = await apiCall('/admin/pelanggan/' + id + '/status', 'PUT', {
        status: 'ban'
    });

    if (res.success) {
        showToast('User berhasil dibanned!');
        loadManajemenUser();
    } else {
        showToast(res.message || 'Gagal membanned user!', 'error');
    }
}

async function ubahStatusUser(id, status) {
    if (!confirm('Ubah status user menjadi ' + status + '?')) return;
    var res = await apiCall('/admin/pelanggan/' + id + '/status', 'PUT', { status: status });
    if (res.success) {
        showToast('Status user berhasil diubah!');
        loadManajemenUser();
    } else {
        showToast(res.message, 'error');
    }
}

// ============================================================
// PENGATURAN
// ============================================================
async function loadPengaturan() {
    var res = await apiCall('/auth/profile');
    if (!res.success) return;
    var u = res.data;
    if (document.getElementById('setNama')) document.getElementById('setNama').value = u.nama || '';
    if (document.getElementById('setEmail')) document.getElementById('setEmail').value = u.email || '';
    if (document.getElementById('setTelp')) document.getElementById('setTelp').value = u.telepon || '';
    if (document.getElementById('setAlamat')) document.getElementById('setAlamat').value = u.alamat || '';
}

async function simpanProfil() {
    var isAdmin = USER.role === 'admin';
    var nama = document.getElementById(isAdmin ? 'setNama' : 'profNama').value;
    var telp = document.getElementById(isAdmin ? 'setTelp' : 'profTelp').value;
    var alamat = document.getElementById(isAdmin ? 'setAlamat' : 'profAlamat').value;

    var res = await apiCall('/auth/profile', 'PUT', { nama: nama, telepon: telp, alamat: alamat });
    if (res.success) {
        USER.nama = nama;
        localStorage.setItem('sipb_user', JSON.stringify(USER));
        showToast('Profil berhasil disimpan!');
    } else {
        showToast(res.message, 'error');
    }
}

async function gantiPassword() {
    var isAdmin = USER.role === 'admin';
    var lama = document.getElementById(isAdmin ? 'passLama' : 'passLamaPel').value;
    var baru = document.getElementById(isAdmin ? 'passBaru' : 'passBaruPel').value;
    var konfirm = document.getElementById(isAdmin ? 'passKonfirm' : 'passKonfirmPel').value;

    if (!lama || !baru || !konfirm) { showToast('Semua field password wajib diisi!', 'error'); return; }
    if (baru !== konfirm) { showToast('Password baru tidak cocok!', 'error'); return; }

    var res = await apiCall('/auth/ganti-password', 'PUT', { password_lama: lama, password_baru: baru });
    if (res.success) {
        showToast('Password berhasil diubah!');
        document.getElementById(isAdmin ? 'passLama' : 'passLamaPel').value = '';
        document.getElementById(isAdmin ? 'passBaru' : 'passBaruPel').value = '';
        document.getElementById(isAdmin ? 'passKonfirm' : 'passKonfirmPel').value = '';
    } else {
        showToast(res.message, 'error');
    }
}

// ============================================================
// BERANDA PELANGGAN
// ============================================================
async function loadBeranda() {
    var res = await apiCall('/pelanggan/pesanan');
    if (!res.success) return;

    var data = res.data || [];

    var aktif = data.filter(function(p) {
        return p.status !== 'selesai';
    }).length;

    var tertunda = data.filter(function(p) {
        return p.status === 'pending' || p.status === 'verifikasi';
    }).length;

    var selesai = data.filter(function(p) {
        return p.status === 'selesai';
    }).length;

    document.getElementById('pelTotalAktif').textContent = aktif;
    document.getElementById('pelBayarTertunda').textContent = tertunda;
    document.getElementById('pelSelesai').textContent = selesai;

    var box = document.getElementById('listBerandaPelanggan');
    if (!box) return;

    if (data.length === 0) {
        box.innerHTML = '<div class="card" style="text-align:center;color:#94a3b8;">Belum ada pesanan</div>';
        return;
    }

    var steps = ['Permintaan', 'Koordinasi', 'Pembayaran DP', 'Pembelian', 'Selesai'];

    function stepAktif(status) {
        if (status === 'pending') return 1;
        if (status === 'verifikasi') return 2;
        if (status === 'diproses') return 4;
        if (status === 'selesai') return 5;
        return 1;
    }

    box.innerHTML = data.map(function(p) {
        var aktifStep = stepAktif(p.status);
        var orderId = generateOrderId(p.id_pelanggan || USER.id, p.tanggal_pesan);

        return `
        <div class="card" style="padding:24px;border-radius:18px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;">
                <div>
                    <h3 style="font-size:18px;font-weight:900;color:#0f172a;margin:0 0 12px;">
                        ${p.nama_barang || p.nama_pesanan || 'Pesanan Barang'}
                    </h3>
                    <div style="font-size:13px;color:#1e293b;">
                        <strong>Tagihan:</strong> ${formatRupiah(p.total_harga || p.total_harga_kesepakatan || 0)}
                    </div>
                </div>

                <div style="font-size:13px;color:#0f172a;font-weight:600;">
                    ${orderId}
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:center;padding:10px 20px 0;">
                ${steps.map(function(s, i) {
                    var nomor = i + 1;
                    var done = nomor <= aktifStep;

                    return `
                    <div style="display:flex;align-items:center;flex:1;${i === steps.length - 1 ? 'flex:0;' : ''}">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;min-width:90px;">
                            <div style="width:54px;height:54px;border-radius:999px;background:${done ? '#1d4f7a' : '#e2e8f0'};border:${done ? '4px solid #dbeafe' : '4px solid #f1f5f9'};display:flex;align-items:center;justify-content:center;color:white;font-size:22px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
                             ${
                               nomor === 1 ? '📦' :
                               nomor === 2 ? '🕒' :
                               nomor === 3 ? '📈' :
                               nomor === 4 ? '📦' :
                               '✅'
                             }
                        </div>
                            <div style="font-size:13px;font-weight:500;color:#1e3a5f;white-space:nowrap;">${s}</div>
                        </div>

                        ${i < steps.length - 1 ? `
                        <div style="
                            height:3px;
                            flex:1;
                            background:${nomor < aktifStep ? '#1d4f7a' : '#cbd5e1'};
                            margin:0 -6px 34px;
                            border-radius:999px;
                        "></div>` : ''}
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }).join('');
}

// ============================================================
// PESANAN SAYA
// ============================================================
function setModePesanan(mode) {
    modePesananAktif = mode;
    var modePilih = document.getElementById('modePilih');
    var modeKetik = document.getElementById('modeKetik');
    var hargaCustomDiv = document.getElementById('hargaCustomDiv');
    var btnModePilih = document.getElementById('btnModePilih');
    var btnModeKetik = document.getElementById('btnModeKetik');

    if (mode === 'pilih') {
        if (modePilih) modePilih.style.display = 'block';
        if (modeKetik) modeKetik.style.display = 'none';
        if (hargaCustomDiv) hargaCustomDiv.style.display = 'none';
        if (btnModePilih) btnModePilih.className = 'btn btn-dark';
        if (btnModeKetik) btnModeKetik.className = 'btn btn-gray';
        hitungTotal();
    } else {
        if (modePilih) modePilih.style.display = 'none';
        if (modeKetik) modeKetik.style.display = 'block';
        if (hargaCustomDiv) hargaCustomDiv.style.display = 'block';
        if (btnModePilih) btnModePilih.className = 'btn btn-gray';
        if (btnModeKetik) btnModeKetik.className = 'btn btn-dark';
        hitungTotalCustom();
    }
}

async function loadPesananSaya() {
    modePesananAktif = 'pilih';
    var res = await apiCall('/pelanggan/barang');
    if (!res.success) return;

    var select = document.getElementById('pilihProduk');
    if (select) {
        select.innerHTML = '<option value="">-- Pilih Produk --</option>' +
            res.data.map(function(b) {
                return '<option value="' + b.id_barang + '" data-harga="' + b.harga_dasar + '">' +
                    b.nama_barang + ' - ' + formatRupiah(b.harga_dasar) + '</option>';
            }).join('');
    }

    var icons = {
        'Kue Ulang Tahun': '🎂', 'Nasi Box': '🍱',
        'Katering Harian': '🍽️', 'Snack Box': '🍪',
        'Kue Tart': '🎂', 'Paket Katering Acara': '🍽️'
    };

    var daftar = document.getElementById('daftarProduk');
    if (daftar) {
        daftar.innerHTML = res.data.map(function(b) {
            var icon = icons[b.nama_barang] || '📦';
            return '<div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all 0.2s;" ' +
                'onclick="pilihProdukDariDaftar(' + b.id_barang + ',\'' + b.nama_barang + '\',' + b.harga_dasar + ')" ' +
                'onmouseover="this.style.borderColor=\'#1e293b\'" ' +
                'onmouseout="this.style.borderColor=\'#e2e8f0\'">' +
                '<span style="font-size:24px;">' + icon + '</span>' +
                '<div style="flex:1;">' +
                '<div style="font-weight:700;font-size:13px;color:#1e293b;">' + b.nama_barang + '</div>' +
                '<div style="font-size:11px;color:#64748b;">' + (b.deskripsi || '') + '</div>' +
                '</div>' +
                '<div style="font-weight:700;color:#1e293b;font-size:13px;">' + formatRupiah(b.harga_dasar) + '</div>' +
                '</div>';
        }).join('');
    }

    if (document.getElementById('estimasiTotal')) document.getElementById('estimasiTotal').textContent = 'Rp 0';
    if (document.getElementById('jmlPesanan')) document.getElementById('jmlPesanan').value = 1;
    if (document.getElementById('catatanPesanan')) document.getElementById('catatanPesanan').value = '';
    setModePesanan('pilih');
}

function pilihProdukDariDaftar(idBarang, namaBarang, harga) {
    setModePesanan('pilih');
    var select = document.getElementById('pilihProduk');
    if (select) select.value = idBarang;
    hitungTotal();
    showToast(namaBarang + ' dipilih!');
}

function hitungTotal() {
    var select = document.getElementById('pilihProduk');
    var jumlah = parseInt(document.getElementById('jmlPesanan') ? document.getElementById('jmlPesanan').value : 1) || 1;
    var option = select ? select.options[select.selectedIndex] : null;
    var harga = option ? parseFloat(option.getAttribute('data-harga')) || 0 : 0;
    var total = harga * jumlah;
    if (document.getElementById('estimasiTotal')) document.getElementById('estimasiTotal').textContent = formatRupiah(total);
}

function hitungTotalCustom() {
    var hargaEl = document.getElementById('hargaCustom');
    var harga = hargaEl ? parseFloat(hargaEl.value) || 0 : 0;
    var jumlah = parseInt(document.getElementById('jmlPesanan') ? document.getElementById('jmlPesanan').value : 1) || 1;
    var total = harga * jumlah;
    if (document.getElementById('estimasiTotal')) document.getElementById('estimasiTotal').textContent = formatRupiah(total);
}

async function buatPesanan() {
    var jumlah = parseInt(document.getElementById('jmlPesanan') ? document.getElementById('jmlPesanan').value : 1);
    var catatan = document.getElementById('catatanPesanan') ? document.getElementById('catatanPesanan').value : '';

    if (!jumlah || jumlah < 1) { showToast('Jumlah minimal 1!', 'error'); return; }

    if (modePesananAktif === 'pilih') {
        var select = document.getElementById('pilihProduk');
        var idBarang = select ? select.value : '';
        if (!idBarang) { showToast('Pilih produk terlebih dahulu!', 'error'); return; }

        var res = await apiCall('/pelanggan/pesanan', 'POST', {
            id_barang: parseInt(idBarang), jumlah: jumlah, catatan: catatan
        });
        if (res.success) {
            showToast('Pesanan berhasil dibuat! No: ' + res.data.kode_pesanan);
            resetFormPesanan();
            goPage('beranda');
        } else {
            showToast(res.message, 'error');
        }
    } else {
        var namaBarangEl = document.getElementById('namaBarangCustom');
        var namaBarang = namaBarangEl ? namaBarangEl.value.trim() : '';
        var hargaCustomEl = document.getElementById('hargaCustom');
        var hargaCustom = hargaCustomEl ? parseFloat(hargaCustomEl.value) || 0 : 0;

        if (!namaBarang) { showToast('Nama barang wajib diisi!', 'error'); return; }

        var catatanLengkap = 'PESANAN CUSTOM: ' + namaBarang;
        if (catatan) catatanLengkap += '\nDetail: ' + catatan;
        if (hargaCustom > 0) catatanLengkap += '\nPerkiraan harga: ' + formatRupiah(hargaCustom);

        var resBarang = await apiCall('/pelanggan/barang');
        if (!resBarang.success || resBarang.data.length === 0) { showToast('Gagal memuat data!', 'error'); return; }

        var res2 = await apiCall('/pelanggan/pesanan', 'POST', {
            id_barang: resBarang.data[0].id_barang,
            jumlah: jumlah,
            catatan: catatanLengkap,
            nama_custom: namaBarang,
            harga_custom: hargaCustom > 0 ? hargaCustom * jumlah : 0
        });

        if (res2.success) {
            showToast('Pesanan custom berhasil dikirim! No: ' + res2.data.kode_pesanan);
            resetFormPesanan();
            goPage('chat');
        } else {
            showToast(res2.message, 'error');
        }
    }
}

function resetFormPesanan() {
    if (document.getElementById('pilihProduk')) document.getElementById('pilihProduk').value = '';
    if (document.getElementById('jmlPesanan')) document.getElementById('jmlPesanan').value = 1;
    if (document.getElementById('catatanPesanan')) document.getElementById('catatanPesanan').value = '';
    if (document.getElementById('estimasiTotal')) document.getElementById('estimasiTotal').textContent = 'Rp 0';
    if (document.getElementById('namaBarangCustom')) document.getElementById('namaBarangCustom').value = '';
    if (document.getElementById('hargaCustom')) document.getElementById('hargaCustom').value = '';
}

// ============================================================
// RIWAYAT TRANSAKSI
// ============================================================
async function loadRiwayat(statusFilter) {
    statusFilter = statusFilter || '';

    var res = await apiCall('/pelanggan/riwayat');

    if (!res.success) {
        showToast(res.message || 'Gagal mengambil riwayat', 'error');
        return;
    }

    var semuaData = res.data || [];
    var data = semuaData;

    if (statusFilter) {
        data = semuaData.filter(function(p) {
            return p.status === statusFilter;
        });
    }

    var totalHarga = semuaData.reduce(function(total, p) {
        return total + Number(p.total_harga || 0);
    }, 0);

    var totalTransaksi = document.getElementById('riwayatTotalTransaksi');
    var totalHargaEl = document.getElementById('riwayatTotalHarga');
    var tb = document.getElementById('tbRiwayatPelanggan');

    if (totalTransaksi) totalTransaksi.textContent = semuaData.length;
    if (totalHargaEl) totalHargaEl.textContent = formatRupiah(totalHarga);

    if (!tb) return;

    if (data.length === 0) {
        tb.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">
                    Belum ada riwayat transaksi
                </td>
            </tr>
        `;
        return;
    }

    var statusLabel = {
        pending: 'Pending',
        verifikasi: 'Verifikasi',
        diproses: 'In Progress',
        selesai: 'Selesai'
    };

    tb.innerHTML = data.map(function(p) {
        var orderId = p.kode_pesanan || generateOrderId(p.id_pelanggan, p.tanggal_pesan);
        var namaBarang = p.nama_barang || 'Pesanan Custom';
        var tagihan = Number(p.total_harga || 0) > 0 ? formatRupiah(p.total_harga) : 'Menunggu Konfirmasi';

        return `
            <tr>
                <td style="text-align:left;padding:18px 22px;font-weight:700;color:#0f172a;">${orderId}</td>
                <td style="text-align:left;padding:18px 22px;">${namaBarang}</td>
                <td style="text-align:left;padding:18px 22px;">${formatTanggal(p.tanggal_pesan)}</td>
                <td style="text-align:left;padding:18px 22px;font-weight:700;color:#0f172a;">${tagihan}</td>
                <td style="text-align:left;padding:18px 22px;">${statusLabel[p.status] || p.status}</td>
                <td style="text-align:left;padding:18px 22px;">
                    <button onclick="lihatDetailRiwayat(${p.id_pesanan})" style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;cursor:pointer;margin-right:6px;">👁️</button>
                    <button onclick="lihatDetailRiwayat(${p.id_pesanan})" style="background:#1e293b;color:white;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;">view</button>
                </td>
            </tr>
        `;
    }).join('');
}

function lihatDetailRiwayat(id) {
    showToast('Detail transaksi ID: ' + id);
}

// ============================================================
// CHAT PELANGGAN
// ============================================================
async function loadChatPelanggan() {
    var res = await apiCall('/pelanggan/pesanan');
    if (!res.success || res.data.length === 0) {
        var area = document.getElementById('chatPelangganArea');
        if (area) area.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:13px;margin-top:20px;">Buat pesanan terlebih dahulu untuk chat dengan admin</div>';
        return;
    }
    selectedPesananId = res.data[0].id_pesanan;
    var resChat = await apiCall('/pelanggan/chat/' + selectedPesananId);
    if (resChat.success) renderChat(resChat.data, 'chatPelangganArea', false);
}

async function kirimChatPelanggan() {
    if (!selectedPesananId) { showToast('Buat pesanan terlebih dahulu!', 'error'); return; }
    var input = document.getElementById('chatPelangganInput');
    var pesan = input ? input.value.trim() : '';
    if (!pesan) return;

    var res = await apiCall('/pelanggan/chat', 'POST', { id_pesanan: selectedPesananId, pesan: pesan });
    if (res.success) {
        if (input) input.value = '';
        var resChat = await apiCall('/pelanggan/chat/' + selectedPesananId);
        if (resChat.success) renderChat(resChat.data, 'chatPelangganArea', false);
    } else {
        showToast(res.message, 'error');
    }
}

function renderChat(messages, containerId, isAdmin) {
    var area = document.getElementById(containerId);
    if (!area) return;

    if (messages.length === 0) {
        area.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:13px;margin-top:20px;">Belum ada pesan</div>';
        return;
    }

    area.innerHTML = messages.map(function(m) {
        var isMe = isAdmin ? m.role === 'admin' : m.role === 'pelanggan';
        var waktu = new Date(m.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        if (isMe) {
            return '<div style="display:flex;gap:8px;align-items:flex-end;flex-direction:row-reverse;">' +
                '<div style="width:26px;height:26px;background:#1e293b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0;">' + m.nama_pengirim.charAt(0) + '</div>' +
                '<div style="align-items:flex-end;display:flex;flex-direction:column;">' +
                '<div class="chat-r">' + m.pesan + '</div>' +
                '<div style="font-size:10px;color:#94a3b8;margin-top:3px;">' + waktu + '</div>' +
                '</div></div>';
        } else {
            return '<div style="display:flex;gap:8px;align-items:flex-end;">' +
                '<div style="width:26px;height:26px;background:#e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">' + m.nama_pengirim.charAt(0) + '</div>' +
                '<div>' +
                '<div class="chat-l">' + m.pesan + '</div>' +
                '<div style="font-size:10px;color:#94a3b8;margin-top:3px;">' + waktu + '</div>' +
                '</div></div>';
        }
    }).join('');

    area.scrollTop = area.scrollHeight;
}

// ============================================================
// PROFIL PELANGGAN
// ============================================================
async function loadProfil() {
    var res = await apiCall('/auth/profile');
    if (!res.success) return;
    var u = res.data;

    var profilAvatar = document.getElementById('profilAvatar');
    var profilNamaDisplay = document.getElementById('profilNamaDisplay');

    if (profilAvatar) profilAvatar.textContent = u.nama.charAt(0).toUpperCase();
    if (profilNamaDisplay) profilNamaDisplay.textContent = u.nama;
    if (document.getElementById('profNama')) document.getElementById('profNama').value = u.nama || '';
    if (document.getElementById('profEmail')) document.getElementById('profEmail').value = u.email || '';
    if (document.getElementById('profTelp')) document.getElementById('profTelp').value = u.telepon || '';
    if (document.getElementById('profAlamat')) document.getElementById('profAlamat').value = u.alamat || '';
}

// ============================================================
// CEK LOGIN SAAT BUKA HALAMAN
// ============================================================
window.onload = function() {
    if (TOKEN && USER) {
        initApp();
    }
};

function startVoiceSearch(inputId) {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showToast('Browser belum mendukung voice search. Gunakan Google Chrome.', 'error');
        return;
    }

    var recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = function(event) {
        var hasil = event.results[0][0].transcript;
        var input = document.getElementById(inputId);

        if (input) {
            input.value = hasil;
            input.dispatchEvent(new Event('input'));
        }

        showToast('Voice search: ' + hasil);
    };

    recognition.onerror = function() {
        showToast('Voice search gagal. Coba lagi.', 'error');
    };
}

function resetFormPesanan(showMessage = true) {
    document.getElementById('namaBarangPesanan').value = '';
    document.getElementById('jumlahBarangPesanan').value = 1;
    document.getElementById('tipeBarangPesanan').value = '';
    document.getElementById('deskripsiPesanan').value = '';
    document.getElementById('fotoPembayaran').value = '';

    if (showMessage) {
        showToast('Form pesanan dikosongkan');
    }
}

async function kirimPermintaanPesanan() {
    var nama = document.getElementById('namaBarangPesanan').value.trim();
    var jumlah = document.getElementById('jumlahBarangPesanan').value;
    var tipe = document.getElementById('tipeBarangPesanan').value;
    var deskripsi = document.getElementById('deskripsiPesanan').value.trim();

    if (!nama || !jumlah || !tipe) {
        showToast('Nama barang, jumlah, dan tipe wajib diisi', 'error');
        return;
    }

    var res = await apiCall('/pelanggan/pesanan', 'POST', {
    nama_barang: nama,
    jumlah: Number(jumlah),
    harga_estimasi: 0,
    catatan: deskripsi || null
    });

    if (res.success) {
        showToast('Permintaan pesanan berhasil dikirim');
        resetFormPesanan(false);
        loadPesananSaya();
    } else {
        showToast(res.message || 'Gagal mengirim pesanan', 'error');
    }
}

function simpanProfilPelanggan() {
    var nama = document.getElementById('profilNama').value.trim();
    var email = document.getElementById('profilEmail').value.trim();
    var telepon = document.getElementById('profilTelepon').value.trim();

    if (!nama || !email || !telepon) {
        showToast('Nama, email, dan nomor telepon wajib diisi', 'error');
        return;
    }

    document.getElementById('profilCardNama').textContent = nama;
    showToast('Profil berhasil diperbarui');
}

function updatePasswordProfil() {
    var lama = document.getElementById('profilPassLama').value;
    var baru = document.getElementById('profilPassBaru').value;
    var konfirmasi = document.getElementById('profilPassKonfirmasi').value;

    if (!lama || !baru || !konfirmasi) {
        showToast('Semua kolom password wajib diisi', 'error');
        return;
    }

    if (baru !== konfirmasi) {
        showToast('Konfirmasi password tidak sama', 'error');
        return;
    }

    showToast('Password berhasil diperbarui');
}

function kirimChatPelanggan() {
    var input = document.getElementById('inputChatPelanggan');
    var box = document.getElementById('chatBoxPelanggan');

    if (!input || !box) return;

    var pesan = input.value.trim();

    if (!pesan) {
        showToast('Pesan tidak boleh kosong', 'error');
        return;
    }

    box.innerHTML +=
        '<div style="display:flex;justify-content:flex-end;">' +
            '<div style="max-width:58%;background:#1e293b;color:white;border-radius:18px 18px 4px 18px;padding:14px 16px;font-size:14px;">' +
                pesan +
            '</div>' +
        '</div>';

    input.value = '';
    box.scrollTop = box.scrollHeight;
}