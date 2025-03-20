const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { exec } = require('child_process'); 
const Image = require('../models/image');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const image = req.file;

        if (!image) return res.status(400).json({ message: "No image uploaded" });

        if (!req.body.institutionId) {
            return res.status(400).json({ message: "Institution ID is required" });
        }

        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File size exceeds 5MB limit" });
        }

        // Upload to ImgBB
        const formData = new FormData();
        formData.append('image', image.buffer, { contentType: image.mimetype });
        formData.append('key', process.env.IMGBB_API_KEY);

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
        });

        const imageUrl = response.data.data.url;

        // Trigger Python Analysis
        exec(`python ./src/image-analysis/analysis.py "${imageUrl}"`, async (error, stdout) => {
            let analysisResult = {
                peopleCount: "N/A",
                engagementScore: 50,
                flagged: false,
                reason: "Analysis not available"
            };

            if (!error) {
                try {
                    const analysisData = JSON.parse(stdout.trim());
                    analysisResult = {
                        peopleCount: analysisData.peopleCount || "N/A",
                        engagementScore: analysisData.engagementScore || 50,
                        flagged: analysisData.flagged || false,
                        reason: analysisData.reason || "Analysis completed"
                    };
                } catch (parseError) {
                    console.error("Error parsing analysis result:", parseError.message);
                }
            }

            const newImage = new Image({
                institutionId: req.body.institutionId,
                imageUrl,
                analysisResult
            });

            await newImage.save();

            res.status(201).json({
                message: "Image uploaded and analyzed successfully",
                image: newImage
            });
        });

    } catch (error) {
        console.error('Error Details:', error.toJSON ? error.toJSON() : error.message);
        res.status(500).json({
            message: "Error uploading image",
            details: error.response ? error.response.data : error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const images = await Image.find(); 
        res.status(200).json(images);
    } catch (error) {
        console.error('Error Details:', error.toJSON ? error.toJSON() : error.message);
        res.status(500).json({
            message: "Error fetching images",
            details: error.response ? error.response.data : error.message
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }

        res.status(200).json(image);
    } catch (error) {
        console.error('Error Details:', error.toJSON ? error.toJSON() : error.message);
        res.status(500).json({
            message: "Error fetching image",
            details: error.response ? error.response.data : error.message
        });
    }
});

module.exports = router;
