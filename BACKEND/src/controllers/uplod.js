const axios = require('axios');
const FormData = require('form-data');
const Image = require('../models/image'); 

exports.uploadImage = async (req, res) => {
    const { institutionId } = req.body;
    const image = req.file;

    if (!image) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    if (!institutionId) {
        return res.status(400).json({ error: 'Institution ID is required' });
    }

    if (image.size > 5 * 1024 * 1024) {  
        return res.
        status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if (!/^image\//.test(image.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only images are allowed." });
    }
    

    const formData = new FormData();
    formData.append('image', image.buffer);
    formData.append('key', process.env.IMGBB_API_KEY);

    try {
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
        });

        const newImage = new Image({
            institutionId,
            imageUrl: response.data.data.url,
        });

        await newImage.save();

        res.status(201).json({ 
            message: "Image uploaded successfully", 
            imageUrl: response.data.data.url 
        });
    } catch (error) {
        console.error('ImgBB Upload Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: 'Failed to upload image',
            details: error.response ? error.response.data : error.message
        });
    }
    
};
