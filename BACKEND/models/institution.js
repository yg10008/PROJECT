const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true 
},
  location: {
    type: String, 
    required: true 
},
  courses: [String],
  infrastructure: {
    type: String 
}, 
  registeredAt: { 
    type: Date, 
    default: Date.now 
}
});

module.exports = mongoose.model("Institution", InstitutionSchema);
