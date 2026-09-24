const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({

    // Connects Member with User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Personal details
    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    gender: {
        type: String,
        required: true
    },

    dateOfBirth: {
        type: Date
    },

    emergencyContact: {
        type: String
    },

    address: {
        type: String
    },

    // Fitness profile
    height: {
        type: Number
    },

    weight: {
        type: Number
    },

    primaryGoal: {
        type: String
    },

    experienceLevel: {
        type: String
    },

    trainingDaysPerWeek: {
        type: Number
    },

    medicalNotes: {
        type: String
    },

    // Membership
    membershipPlan: {
        type: String,
        required: true
    },

    membershipStartDate: {
        type: Date,
        required: true
    },

    paymentMethod: {
        type: String
    },

    amountPaid: {
        type: Number
    }

});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;