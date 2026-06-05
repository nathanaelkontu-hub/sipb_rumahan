require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { createCloudinaryStorage } = require('./config/cloudinary');

const app = express();
const storage = createCloudinaryStorage('test');
const upload = multer({ storage });

app.post('/test-upload', upload.single('gambar'), (req, res) => {
    console.log("REQ.FILE:", req.file);
    res.json({ file: req.file });
});

app.listen(3001, () => {
    console.log("Test server running on port 3001");
});
