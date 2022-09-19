const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const slotSchema = new Schema({
    time: {
        type: String,
    },
    isBooked: {
        type: Boolean,
        default: false
    }
});

const dateSchedule = new Schema({
    date: {
        type: String
    },
    slots: [slotSchema]
});

const terraformSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    feesPerSession: {
        type: String
    },
    dates: [dateSchedule]
});

const Terraform = mongoose.model('Terraform', terraformSchema);
const Slot = mongoose.model('Slot', slotSchema);
const DateSchedule = mongoose.model('DateSchedule', dateSchedule);
module.exports = {
    Terraform,
    Slot,
    DateSchedule
};