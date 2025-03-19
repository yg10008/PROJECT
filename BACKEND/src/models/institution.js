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
  courses: [{
    name: { type: String, required: true },
    duration: { type: String }
  }],
  infrastructure: {
    classrooms: { 
      type: Number, 
      default: 0 
    },
    labs: { 
      type: Number, 
      default: 0 
    },
    libraries: { 
      type: Boolean, 
      default: false 
    }
  },
  contact: {
    phone: { 
      type: String, 
      match: /^[0-9]{10}$/ 
    }, 
    email: { 
      type: String, 
      match: /.+\@.+\..+/ 
    }  
  },
  registeredAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Institution", InstitutionSchema);
