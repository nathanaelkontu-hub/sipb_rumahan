const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function upload() {
    fs.writeFileSync('dummy.jpg', 'dummy image content');
    const form = new FormData();
    form.append('gambar', fs.createReadStream('dummy.jpg'));
    
    try {
        const res = await axios.post('http://localhost:3001/test-upload', form, {
            headers: form.getHeaders()
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.error(e.message);
    }
}
upload();
