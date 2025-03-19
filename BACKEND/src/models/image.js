const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  institutionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Institution", 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true, 
    match: /\.(jpg|jpeg|png|gif)$/i  
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  description: { 
    type: String, 
    default: "" 
  },
  analysisResult: {
    peopleCount: { type: Number, min: 0, default: 0 }, 
    engagementScore: { type: Number, min: 0, max: 100, default: 0 }, 
    flagged: { type: Boolean, default: false }, 
    reason: { type: String, default: "" }
}

});

module.exports = mongoose.model("Image", ImageSchema);
