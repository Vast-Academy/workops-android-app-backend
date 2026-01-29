const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    displayName: {
        type: String,
        default: ''
    },
    photoURL: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: null
    },
    isPasswordSet: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'engineer'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
