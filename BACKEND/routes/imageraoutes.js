const express = require("express");
const multer = require("multer");
const router = express.Router();
const Image = require("../models/image");

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { institutionId } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const newImage = new Image({ institutionId, imageUrl });
    await newImage.save();

    res.status(201).json({ message: "Image uploaded", image: newImage });
  } catch (error) {
    res.status(500).json({ message: "Error uploading image", error });
  }
});

module.exports = router;
