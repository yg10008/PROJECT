const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { exec } = require('child_process');
const Image = require('../models/image');
const { userAuth } = require("../middleware/auth");
const { roleAuth } = require("../middleware/roleAuth");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", userAuth, upload.single("image"), async (req, res) => {
    try {
        const image = req.file;

        if (!image) return res.status(400).json({ message: "No image uploaded" });

        if (!req.body.institutionId) {
            return res.status(400).json({ message: "Institution ID is required" });
        }

        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File size exceeds 5MB limit" });
        }

        const formData = new FormData();
        formData.append("image", image.buffer.toString('base64'));
        formData.append('key',"583f2385696ff905a6fd751587bb8e75");

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
        });

        const imageUrl = response.data.data.url;

        exec(`python ./src/image-analysis/analysis.py ${imageUrl}`, async (error, stdout, stderr) => {
            let analysisResult = {
                peopleCount: 0,
                engagementScore: 0,
                flagged: true,
                reason: "Analysis failed"
            };

            if (!error) {
                try {
                    analysisResult = JSON.parse(stdout.trim());
                } catch (parseError) {
                    console.error(`Error parsing analysis result: ${parseError.message}`);
                }
            } else {
                console.error(`Python Analysis Error: ${error.message}`);
            }

            const newImage = new Image({
                institutionId: req.body.institutionId,
                imageUrl,
                analysisResult
            });

            await newImage.save();
            console.log("🔹 Python Analysis Output:", analysisResult);

            res.status(201).json({ message: "Image uploaded and analyzed successfully", image: newImage });
        });
    } catch (error) {
        console.error('Error Details:', error.toJSON ? error.toJSON() : error.message);
        res.status(500).json({
            message: "Error uploading image",
            details: error.response ? error.response.data : error.message
        });
    }
});

router.get("/", userAuth, roleAuth("admin"), async (req, res) => {
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

router.get("/:id", userAuth, async (req, res) => {
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
