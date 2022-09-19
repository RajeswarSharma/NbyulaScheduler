require('dotenv').config();
const bcrypt = require("bcrypt")
const SALT_ROUND=10;


/**
 * 
 * @param {String} plainTextPass 
 * @returns {String}
 */
const hash = async(plainTextPass)=>{
    const salt = await bcrypt.genSalt(SALT_ROUND);
    const hashed = await bcrypt.hash(plainTextPass,salt);
    return hashed;
}

/**
 * 
 * @param {String} encryptedPass 
 * @param {String} actualPass 
 * @returns {Boolean}
 */
const compare=async(encryptedPass, actualPass)=>{
  isValid = await bcrypt.compare(actualPass,encryptedPass); 
  return isValid;  
}

module.exports = {
    hash, compare
}