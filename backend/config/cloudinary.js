const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Konfigurasi menggunakan nilai dari .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fungsi pembuat storage agar fleksibel (bisa dipanggil berulang-ulang untuk folder yang berbeda di route)
const createCloudinaryStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `sipb_rumahan/${folderName}`,
      allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
      // Cloudinary akan memproses gambar menjadi lebih optimal
    },
  });
};

module.exports = {
  cloudinary,
  createCloudinaryStorage,
};
