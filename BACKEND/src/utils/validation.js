const validator = require("validator");

const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName || !lastName) {
        throw new Error("ENTER_VALID_USERNAME");
    }

    if (!validator.isEmail(emailId)) {
        throw new Error("ENTER_VALID_EMAIL_ID");
    }

    if (!validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })) {
        throw new Error("ENTER_STRONG_PASSWORD (Min 8 chars, 1 Uppercase, 1 Number, 1 Symbol)");
    }
};

const validationProfileEditData = (req) => {
    const validEditFields = [
        "firstName",
        "lastName",
        "about",
        "photoUrl",
        "age",
        "gender",
        "skills"
    ];

    const isValidEditFields = Object.keys(req.body).every(field => validEditFields.includes(field));

    return isValidEditFields;
};

const validateNewPassword = async (req) => {
    const newPassword = req.body.password;

    return validator.isStrongPassword(newPassword);
};

module.exports = {
    validateSignUpData,
    validationProfileEditData,
    validateNewPassword
};
