// Fungsi untuk memparsing URL gambar
// - Jika dari Cloudinary (mengandung http/https), gunakan URL utuh.
// - Jika data lama (hanya nama file), gunakan URL backend lokal.
export default function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/uploads/${path}`;
}
