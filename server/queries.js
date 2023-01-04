const mysql = require("mysql");

//establish connection with DB
const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "Password",
  database: "passwordwallet",
});

//query to add password to database
//input hashed password, user id, web address, optional description and callback function
//returns object with response if password was added as callback function
const addPassword = (hashedPassword, userID, webAddress, desc, callback) => {
  db.query(
    "INSERT INTO password (password,id_user,web_address,description) VALUES (?,?,?,?)",
    [hashedPassword, userID, webAddress, desc],
    (err, result) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "PASSWORD ADDED" });
    }
  );
};

/**
 * querry to delete password from database
 *
 * inputs
 * @param {*} IDPassword - id of password to be deleted
 * @param {*} callback - function to get data form db.querry
 *
 * returns callback response as object
 */

const deletePassword = (IDPassword, callback) => {
  db.query(
    "DELETE FROM password WHERE (ID = ?)",

    [IDPassword],
    (err, res) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "SUCCESS" });
    }
  );
};

//query to get passwords that was saved by user
//input user id and callback function
//returns object with passwords or object with message about failure
const getPasswords = (userID, callback) => {
  db.query(
    "SELECT * FROM password where id_user = ?",
    [userID],
    (err, result) => {
      if (err) {
        return callback({ response: "ERROR" });
      } else {
        return callback(result);
      }
    }
  );
};

//query to update user
//input encrypted password, salt, boolean that states if the password is hashed, user id and callback function
//returns object with response if user was updated as callback function
const updateUser = (encrypted, salt, isPasswordHashed, userID, callback) => {
  db.query(
    "Update users SET password = ?, salt = ? , isPasswordHashed = ? where ID = ?",
    [encrypted, salt, isPasswordHashed, userID],
    (err, result) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "PASSWORD CHANGED" });
    }
  );
};

//returns user credentials for validation, search by ID
//input user id
//output credentials
const getUserCredentialsByID = (userID, callback) => {
  db.query("SELECT * FROM users where ID = ?", [userID], (err, result) => {
    if (err) {
      return callback({ response: "ERROR" });
    } else {
      return callback(result);
    }
  });
};

//returns user credentials for validation, search by username
//input username
//output credentials
const getUserCredentialsByUsername = (username, callback) => {
  db.query(
    "SELECT * FROM users where username = ?",
    [username],
    (req, result) => {
      if (result === undefined) {
        return callback({ response: "Podano złe dane" });
      } else {
        return callback(result);
      }
    }
  );
};

//inserts new user into DB
//input username, hash of password and flag if password is hashed
//output response message as object
const insertNewUser = (
  username,
  hash,
  salt,
  isPasswordHashed,
  Date,
  callback
) => {
  db.query(
    "INSERT INTO users (username,password,salt,timeout,isPasswordHashed) VALUES (?,?,?,?,?)",
    [username, hash, salt, Date, isPasswordHashed],
    (err, result) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "REGISTERED" });
    }
  );
};

//Inserts new login attempt into DB
//input ID of user account that somebody tried to access, IP address of someone that tried to access account,
//date and time of attempt parsed by another function, status of attempt (success or failure) and callback function (only for testing purposes)
//outputs callback message for testing purposes
const insertNewLoginAttempt = (ID, ipAddress, DateTime, status, callback) => {
  db.query(
    "INSERT INTO loginattempts (IDUser, IP, DateTime, Status) VALUES (?,?,?,?)",
    [ID, ipAddress, DateTime, status],
    (err, result) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "SUCCESS" });
    }
  );
};
/**
 * querry for login attempt deletion from DB
 *
 * input
 * @param {*} IDAttempt - ID of login attempt to be deleted
 * @param {*} callback - callback function
 *
 * returns callback message as object
 */
const deleteLoginAttempt = (IDAttempt, callback) => {
  db.query(
    "DELETE FROM loginattempts WHERE (idAttempt = ?)",

    [IDAttempt],
    (err, res) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "SUCCESS" });
    }
  );
};
//returns object with all login attempts that user made
//input ID user and callback function
//returns object or error message
const getLoginAttempts = (ID, numberOfAttempts, callback) => {
  db.query(
    "SELECT * FROM  loginattempts WHERE IDUser = ? ORDER BY idAttempt DESC LIMIT ?",
    [ID, numberOfAttempts],
    (err, result) => {
      if (err) return callback({ response: "ERROR" });
      else return callback(result);
    }
  );
};

/**
 * querry to set users timeout
 *
 * inputs
 * @param {*} IDUser - id of user to set timeout
 * @param {*} Timeout - dateTime of end of timeout
 * @param {*} callback - callback function
 *
 * returns callback response as object
 */
const setUserTimeoutDB = (IDUser, Timeout, callback) => {
  db.query(
    "Update users SET timeout = ? where ID = ?",
    [Timeout, IDUser],
    (err, res) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "SUCCESS" });
    }
  );
};

/**
 * querry used to get users timeout
 *
 * inputs
 * @param {*} IDUser - ID of user to get it's timeout
 * @param {*} callback - callback function
 *
 * returns callback response as object
 */
const checkUserTimeoutDB = (IDUser, callback) => {
  db.query("Select timeout FROM users where ID = ?", [IDUser], (err, res) => {
    if (err) {
      return callback({ response: "ERROR" });
    }
    return callback(res[0].timeout);
  });
};

module.exports = {
  addPassword,
  updateUser,
  getPasswords,
  getUserCredentialsByID,
  getUserCredentialsByUsername,
  insertNewUser,
  insertNewLoginAttempt,
  getLoginAttempts,
  setUserTimeoutDB,
  checkUserTimeoutDB,
  deleteLoginAttempt,
  deletePassword,
};
