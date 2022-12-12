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

//query to update user
//input encrypted password, salt, boolean that states if the password is hashed, user id and callback function
//returns object with response if user was updated as callback function
const updateUser = (encrypted, salt, isPasswordHashed, userID, callback) => {
  db.query(
    "Update users SET password = ?, salt = ? , isPasswordHashed = ? where ID = ?;",
    [encrypted, salt, isPasswordHashed, userID],
    (err, result) => {
      if (err) return callback({ response: "ERROR" });
      else return callback({ response: "PASSWORD CHANGED" });
    }
  );
};

//query to get passwords that was saved by user
//input user id and callback function
//returns object with passwords or object with message about failure
const getPasswords = (userID, callback) => {
  db.query(
    "SELECT ID,password,web_address,description FROM password where id_user = ?",
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

//returns user credentials for validation, search by ID
//input user id
//output credentials
const getUserCredentialsByID = (userID, callback) => {
  db.query(
    "SELECT password,salt,isPasswordHashed FROM users where ID = ?",
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
//returns user credentials for validation, search by username
//input username
//output credentials
const getUserCredentialsByUsername = (username, callback) => {
  db.query(
    "SELECT ID,password,salt,isPasswordHashed FROM users where username = ?",
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
const insertNewUser = (username, hash, salt, isPasswordHashed, callback) => {
  db.query(
    "INSERT INTO users (username,password,salt,isPasswordHashed) VALUES (?,?,?,?)",
    [username, hash, salt, isPasswordHashed],
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

module.exports = {
  addPassword,
  updateUser,
  getPasswords,
  getUserCredentialsByID,
  getUserCredentialsByUsername,
  insertNewUser,
  insertNewLoginAttempt,
};
