const express = require("express");
const router = express.Router();
const Institution = require("../models/institution");
const { userAuth } = require("../middleware/auth");
const { roleAuth } = require("../middleware/roleAuth");

// Admin Only: Add Institution
router.post("/", userAuth, roleAuth("admin"), async (req, res) => {
    try {
        const { name, location, courses, infrastructure } = req.body;

        if (!name || !location || !courses || !infrastructure) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingInstitution = await Institution.findOne({ name, location });

        if (existingInstitution) {
            return res.status(400).json({ message: "Institution with this name and location already exists" });
        }

        const newInstitution = new Institution({
            name,
            location,
            courses,
            infrastructure
        });

        await newInstitution.save();
        res.status(201).json({ message: "Institution registered successfully", institution: newInstitution });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// User & Admin: View All Institutions
router.get("/", userAuth, async (req, res) => {
    try {
        const institutions = await Institution.find().sort({ name: 1 });
        res.json(institutions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching institutions", error });
    }
});

// User & Admin: Search Institution by Name
router.get("/search/:name", userAuth, async (req, res) => {
    try {
        const institution = await Institution.findOne({ name: req.params.name });

        if (!institution) {
            return res.status(404).json({ message: "Institution not found" });
        }

        res.json(institution);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
