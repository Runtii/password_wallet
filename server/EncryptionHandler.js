const crypto = require("crypto");
const secret = "6fa979f20126cb08aa645a8f495f6d85"; //random encryption key
const salt = "7777777a72ddc2f1"; //random initialization vector

//encrypt password with SHA method with usage of salt
//input password to hash
//output object with salt and hashed password
const encryptSHA = (password) => {
  const saltMaster = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, saltMaster, 1000, 64, `sha512`)
    .toString(`hex`);
  return {
    salt: saltMaster.toString("hex"),
    password: hash.toString("hex"),
  };
};

//input password, hashed password to validate and salt
//output boolean
const validateSHA = (password, hash, salt) => {
  var hash_temp = crypto
    .pbkdf2Sync(password, salt, 1000, 64, `sha512`)
    .toString(`hex`);
  return hash_temp === hash;
};

//input password to encrypt with simple HMAC method
//output hashed password
const encryptHMAC = (password) => {
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
};

//input password and hashed with HMAC password
//output boolean
const validateHMAC = (password, hash) => {
  return toString(hash) === toString(encryptHMAC(password));
};

//function for passwords encryption wit aes-256-cbc method
//input password
//output encrypted password
const encrypt = (password) => {
  let cipher = crypto.createCipheriv("aes-256-cbc", secret, salt);
  let encrypted = cipher.update(password, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

//function for  reverting passwords encryption wit aes-256-cbc method
//input encrypted password
//output password
const decrypt = (encrypted) => {
  encrypted = encrypted.toString();
  let decipher = crypto.createDecipheriv("aes-256-cbc", secret, salt);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  return decrypted + decipher.final("utf8");
};

module.exports = {
  encrypt,
  decrypt,
  encryptSHA,
  encryptHMAC,
  validateSHA,
  validateHMAC,
};
