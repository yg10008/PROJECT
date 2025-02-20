const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: "Image", required: true },
  peopleCount: { type: Number, required: true },
  engagementScore: { type: Number, required: true },
  activitiesDetected: [String], // Example: ['Writing', 'Listening', 'Idle']
  flagged: { type: Boolean, required: true },
  reason: { type: String },
  analyzedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Analysis", AnalysisSchema);
