const express = require("express");
const router = express.Router();
const Institution = require("../models/Institution");

const mongoose = require("mongoose");

router.post("/", async (req, res) => {
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


router.get("/:id", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid Institution ID format" });
    }

    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({ message: "Institution not found" });
        }
        res.json(institution);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

router.get("/", async (req, res) => {
    try {
        const institutions = await Institution.find().sort({ name: 1 });
        res.json(institutions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching institutions", error });
    }
});

module.exports = router;