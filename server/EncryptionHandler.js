const crypto = require("crypto");
const secret = "6fa979f20126cb08aa645a8f495f6d85"; //random encryption key
const salt = "7777777a72ddc2f1"; //random initialization vector
const saltedSha512 = require("salted-sha512");

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

const validateSHA = (password, salt, hash) => {
  var hash_temp = crypto
    .pbkdf2Sync(password, salt, 1000, 64, `sha512`)
    .toString(`hex`);
  return hash_temp === hash;
};

const encryptHMAC = (password) => {
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
};

const encrypt = (plain) => {
  let cipher = crypto.createCipheriv("aes-256-cbc", secret, salt);
  let encrypted = cipher.update(plain, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

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
};
