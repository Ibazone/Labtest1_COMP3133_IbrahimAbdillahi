const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,   // Ensure the username is unique
    },
    firstname: String,
    lastname: String,
    password: {
        type: String,
        required: true
    },
    createon: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
