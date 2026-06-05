require('dotenv').config();
const { cloudinary } = require('./config/cloudinary');

async function testCloudinary() {
    console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("API Key:", process.env.CLOUDINARY_API_KEY);
    
    try {
        const result = await cloudinary.api.ping();
        console.log("Ping success:", result);
        console.log("Cloudinary connection works!");
    } catch (err) {
        console.error("Cloudinary connection failed:", err);
    }
}

testCloudinary();
