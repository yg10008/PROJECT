const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  imageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Image", 
    required: true 
  },
  peopleCount: { 
    type: Number, 
    required: true 
  },
  engagementScore: { 
    type: Number, 
    required: true,
    min: 0, 
    max: 100 
  },
  activitiesDetected: [{
    activity: { type: String },
    confidence: { type: Number, min: 0, max: 100, required: true }
  }],
  flagged: { 
    type: Boolean, 
    required: true 
  },
  reason: { 
    type: String, 
    default: function() {
        return this.flagged ? "Low engagement detected" : "";
    } 
  },
  analyzedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Analysis", AnalysisSchema);
