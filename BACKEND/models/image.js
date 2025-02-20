const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  institutionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Institution", 
    required: true 
},
  imageUrl: { 
    type: String, 
    required: true 
}, // Cloud storage link
  uploadedAt: { 
    type: Date, 
    default: Date.now 
},
  analysisResult: {
    peopleCount: Number,
    engagementScore: Number,
    flagged: Boolean,
    reason: String
  }
});

module.exports = mongoose.model("Image", ImageSchema);
