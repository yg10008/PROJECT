const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://yg:vqWTQ96RaE1L2prr@nodeyg.sx9dr.mongodb.net/OPERATION", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error(`DATABASE CONNECTION FAILED: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = { connectDB };
