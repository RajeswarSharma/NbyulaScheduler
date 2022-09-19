const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const terraformUserSchema = new Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String
    },
    name: {
        type: String
    },
    picture: {
        type: String
    },
    phoneNumber: {
        type: String
    }
});

const TerraformUser = mongoose.model('TerraformerUser', terraformUserSchema);
module.exports = TerraformUser;