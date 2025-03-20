const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minLength: 4, maxLength: 50 },
    lastName: { type: String, minLength: 4, maxLength: 50 },
    emailId: { 
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    password: { type: String, required: true, minLength: 8 },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    age: { type: Number, min: 18, max: 30 },
    gender: { type: String, enum: ["male", "female"] },
    photoUrl: { type: String, default: "url! url! url!" },
    about: { type: String, default: "about" },
    skills: { 
        type: [String], 
        validate: value => value.length <= 5 
    }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.getJWT = async function () {
    return jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET || "classROOM@system$123", { expiresIn: "8h" });
};

userSchema.methods.getPasswordAuthentication = async function (passwordInputByUserInstance) {
    return await bcrypt.compare(passwordInputByUserInstance, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = { User };
