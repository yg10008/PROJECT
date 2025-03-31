const axios = require('axios');
const FormData = require('form-data');

const uploadToImgBB = async (imageBuffer, filename) => {
    try {
        const formData = new FormData();
        formData.append('image', imageBuffer, filename);

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            params: {
                key: process.env.IMGBB_API_KEY
            },
            headers: formData.getHeaders()
        });

        return response.data.data.url;
    } catch (error) {
        logError('ImgBB upload failed', error);
        throw new Error('Image upload failed');
    }
}; 