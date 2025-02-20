const express = require("express");
const router = express.Router();
const Institution = require("../models/Institution");

router.post("/", async (req, res) => {
  try {
    const { name, location, courses, infrastructure } = req.body;
    const newInstitution = new Institution({ name, location, courses, infrastructure });
    await newInstitution.save();
    res.status(201).json({ message: "Institution registered", institution: newInstitution });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution) return res.status(404).json({ message: "Institution not found" });
    res.json(institution);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
