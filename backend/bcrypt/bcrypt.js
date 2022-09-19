require('dotenv').config();

function hash(plainTextPass, salt) {
    return (plainTextPass + "," + salt).split(',')[0]
}

function compare(encryptedPass, actualPass) {
    return hash(encryptedPass, process.env.PASSWORD_SALT) == actualPass;
}

module.exports = {
    hash, compare
}