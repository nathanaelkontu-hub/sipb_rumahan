const fs = require('fs');
const path = require('path');

const files = [
  "src/pages/pelanggan/ProfilSaya.jsx",
  "src/pages/pelanggan/ChatAdmin.jsx",
  "src/pages/admin/LaporanKeuangan.jsx",
  "src/pages/admin/KoordinasiHarga.jsx",
  "src/pages/admin/DaftarPesanan.jsx",
  "src/layouts/PelangganLayout.jsx",
  "src/layouts/AdminLayout.jsx",
  "src/api/api.js"
];

files.forEach(file => {
  const p = path.join(__dirname, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if (file === "src/api/api.js") {
    content = content.replace(
      /baseURL:\s*"http:\/\/localhost:3000\/api"/g,
      'baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api"'
    );
  } else {
    // Replace inside template literals
    content = content.replace(/`http:\/\/localhost:3000/g, '`${import.meta.env.VITE_BASE_URL || "http://localhost:3000"}');
    // Replace string literals (if any)
    content = content.replace(/"http:\/\/localhost:3000/g, 'import.meta.env.VITE_BASE_URL + "');
  }
  
  fs.writeFileSync(p, content, 'utf8');
  console.log('Updated ' + file);
});

fs.writeFileSync('.env', 'VITE_BASE_URL=http://localhost:3000\nVITE_API_URL=http://localhost:3000/api\n', 'utf8');
console.log('Created .env');
