const express = require("express");
const app = express();
const PORT = 3001;
const cors = require("cors");

//import all the queries
const {
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
  sharePassword,
  getOwnerID,
} = require("./queries");

//import all functions for encryption, decryption and validation
const {
  encrypt,
  decrypt,
  encryptSHA,
  encryptHMAC,
  validateSHA,
  validateHMAC,
} = require("./EncryptionHandler");

app.use(cors());
app.use(express.json());

//provides validation of user password regardless of the encryption type
//input given password, hash from DB, optional salt from DB
//output boolean
const validatePassword = (password, hash, salt) => {
  if (salt) {
    return validateSHA(password, hash, salt);
  } else {
    return validateHMAC(password, hash);
  }
};
/**
 * validates ownership of password
 *
 * inputs
 * @param {*} IDUser - userID that needs to be checked
 * @param {*} IDPassword - ID password
 *
 * @returns boolean flag that states state of validation
 */
const validateOwnership = (IDUser, IDPassword, callback) => {
  getOwnerID(IDPassword, (IDInDB) => {
    if (IDUser === IDInDB[0].id_user) return callback(true);
    else return callback(false);
  });
};
//adds password to DB (via function with db query inside)
//request input: new password, id of the user, web address of the given password, optional description
//returns result of operation (object with message)
app.post("/addPassword", (req, res) => {
  const { password, userID, webAddress, desc } = req.body;
  if (password != null || userID != null) {
    addPassword(
      encrypt(password),
      userID,
      webAddress,
      desc,
      function (resultOfAddPassword) {
        res.send(resultOfAddPassword);
      }
    );
  }
});
/**
 * Endnode for deletion of stored password by user
 *
 * input
 * userID - id of user that tries to delete stored password
 * password - master password for validation
 * IDPassword - id of password to be deleted
 *
 * returns callback from DB or error message when validation didn't pass
 */
app.post("/deleteStoredPassword", (req, res) => {
  const { userID, password, IDPassword } = req.body;

  getUserCredentialsByID(userID, (credentials) => {
    const validation = validatePassword(
      password,
      credentials[0].password,
      credentials[0].salt
    );
    if (!validation) res.send({ response: "NOT VALIDATED" });

    validateOwnership(userID, IDPassword, (ownerValidation) => {
      if (!ownerValidation) {
        res.send({ response: "NOT OWNER" });
        return 0;
      }

      deletePassword(IDPassword, function (callback) {
        res.send(callback);
        return 0;
      });
    });
  });
});

/**
 * validation before sharing password
 *
 * inputs
 * @param userID - userID that owns password
 * @param password - master password of owner
 * @param IDPassword - password ID
 * @param usernameToShare - username that password will be shared
 *
 * @forwards response message from DB
 */
app.post("/shareStoredPassword", (req, res) => {
  const { userID, password, IDPassword, usernameToShare } = req.body;
  getUserCredentialsByID(userID, (credentials) => {
    const validation = validatePassword(
      password,
      credentials[0].password,
      credentials[0].salt
    );

    validateOwnership(userID, IDPassword, (ownerValidation) => {
      getUserCredentialsByUsername(
        usernameToShare,
        (userToShareCredentials) => {
          if (
            userToShareCredentials[0] === null ||
            userToShareCredentials[0] === undefined
          ) {
            res.send({ response: "WRONG USERNAME" });
            return 0;
          }
          console.log(
            userID,
            password,
            IDPassword,
            usernameToShare,
            userToShareCredentials[0].ID
          );
          if (!ownerValidation) {
            res.send({ response: "NOT AN OWNER" });
            return 0;
          }
          if (userID === userToShareCredentials[0].ID) {
            res.send({ response: "YOU ARE OWNER" });
            return 0;
          }
          if (!validation) {
            res.send({ response: "NOT LOGGED IN" });
            return 0;
          }

          sharePassword(
            userID,
            IDPassword,
            userToShareCredentials[0].ID,
            function (callback) {
              res.send(callback);
              return 0;
            }
          );
        }
      );
    });
  });
});
//gets passwords from DB saved by user, first it validates user then returns passwords it
//also parses value of field sharedTo because of errors on doing it on client side
//input user id and user master password for validation
//returns object with response as string message
app.post("/getPasswords", (req, res) => {
  const { userID, password } = req.body;
  getUserCredentialsByID(userID, function (credentials) {
    if (
      validatePassword(password, credentials[0].password, credentials[0].salt)
    )
      getPasswords(userID, function (resultOfGetPassword) {
        var temp = "";
        for (i in resultOfGetPassword) {
          resultOfGetPassword[i].sharedTo = JSON.parse(
            resultOfGetPassword[i].sharedTo
          );
          for (j in resultOfGetPassword[i].sharedTo) {
            temp += resultOfGetPassword[i].sharedTo[j] + ", ";
          }
          resultOfGetPassword[i].sharedTo = temp;
          temp = "";
        }

        res.send(resultOfGetPassword);
      });
    else res.send({ response: "ERROR" });
  });
});
/**
 * EndNode to get login attempts from DB
 *
 * input
 * userID - id of user that tries to get login attempts
 * numberOfAttempts - user can specify how many attempts should be sent (future function)
 * password - master password for validation
 *
 * return
 * forwards response from DB or error if validation didn't pass
 */
app.post("/getLoginAttempts", (req, res) => {
  const { userID, numberOfAttempts, password } = req.body;
  getUserCredentialsByID(userID, function (credentials) {
    if (
      validatePassword(password, credentials[0].password, credentials[0].salt)
    )
      getLoginAttempts(
        userID,
        numberOfAttempts,
        function (resultOfGetPassword) {
          res.send(resultOfGetPassword);
        }
      );
    else res.send({ response: "ERROR" });
  });
});

//encrypts password that is needed for addPassword validation
//input plain text password
//returns encrypted password
app.post("/encrypt", (req, res) => {
  res.send({ encrypted: encrypt(req.body.password) });
});

//decrypts password that user clicked in client and sends it back
//input encrypted password to be decrypted
//returns decrypted password
app.post("/decrypt", (req, res) => {
  res.send(decrypt(req.body.password));
});

//change users password (user is logged in but still worth to validate)
//input user id, master password, new password and flag if new password is hashed
//returns response as object with string message
app.post("/changePassword", (req, res) => {
  const { userID, currentPassword, passwordToChange, isHashedNew } = req.body;

  getUserCredentialsByID(userID, function (credentials) {
    if (
      !validatePassword(
        currentPassword,
        credentials[0].password,
        credentials[0].salt
      )
    ) {
      res.send({ response: "VALIDATION ERROR" });
    }

    if (isHashedNew === "isHashed") {
      result = encryptSHA(passwordToChange);
      const encrypted = result.password;
      const salt = result.salt;
      updateUser(encrypted, salt, 1, userID, function (callback) {
        res.send(callback);
      });
    } else {
      const encrypted = encryptHMAC(passwordToChange);
      updateUser(encrypted, null, null, userID, function (callback) {
        res.send(callback);
      });
    }
  });
});

//registers new user into DB
//input username, password and flag if the password should be hashed
//output response message as object
app.post("/register", (req, res) => {
  const { username, password, isHashed } = req.body;
  if (isHashed === "isHashed") {
    result = encryptSHA(password);
    const encrypted = result.password;
    const salt = result.salt;
    insertNewUser(
      username,
      encrypted,
      salt,
      1,
      getDateTime(),
      function (newUserStatus) {
        if (newUserStatus.response) res.send(newUserStatus.response);
      }
    );
  } else {
    const encrypted = encryptHMAC(password);
    insertNewUser(
      username,
      encrypted,
      null,
      null,
      getDateTime(),
      function (newUserStatus) {
        if (newUserStatus.response) res.send(newUserStatus.response);
      }
    );
  }
});

//validates user credentials and sends back response message and if validation was made with success also returns user id
//also tracks ip of user that tries to log in and saves login attempt
//input username and password
//output response message and id if successful
app.post("/login", (req, res) => {
  const ipAddress = req.socket.remoteAddress;
  const { username, password } = req.body;

  getUserCredentialsByUsername(username, function (credentials) {
    let status = "";
    if (credentials[0] === undefined)
      res.send({ response: "Podano złe dane!" });

    const validation = validatePassword(
      password,
      credentials[0].password,
      credentials[0].salt
    );
    UserTimeout(
      credentials[0].ID,
      validation,
      ipAddress,
      function (TimeoutResult) {
        let isTimeout = TimeoutResult.isTimeout
          ? TimeoutResult.isTimeout
          : false;
        const Timeout = TimeoutResult.Timeout;

        let message = "Złe dane! Masz zablokowaną możliwość logowania do ";
        if (isTimeout === true) {
          res.send({ response: message + getDateTime(Timeout) });
          isTimeout = false;
          return 0;
        }

        if (validation && isTimeout === false) {
          status = "Pomyślne logowanie";
          saveAttempt(
            credentials[0].ID,
            ipAddress,
            getDateTime(),
            status,
            function (callback) {}
          );
          res.send({ response: "AUTH", ID: credentials[0].ID });
          return 0;
        } else {
          res.send({ response: "Złe dane!" });
        }
      }
    );
  });
});

//saves login attempt into DB
//returns status (only for testing)
const saveAttempt = (ID, ipAddress, DateTime, status, callbackATT) => {
  insertNewLoginAttempt(ID, ipAddress, DateTime, status, function (callback) {
    callbackATT(callback.response);
  });
};

/**
 * endnode for daleting login attempt
 *
 * inputs
 * @param username,
 * @param password
 * @param IDAttempt
 *
 */
app.post("/deleteAttempt", (req, res) => {
  const { username, password, IDAttempt } = req.body;

  getUserCredentialsByUsername(username, function (credentials) {
    const validation = validatePassword(
      password,
      credentials[0].password,
      credentials[0].salt
    );
    if (validation) {
      deleteLoginAttempt(IDAttempt, function (callback) {
        res.send(callback);
      });
    } else res.send({ response: "ERROR" });
  });
});

/**
 * function that sets user timeout and checks if user is timeouted and returns that information
 *
 * input
 * @param {*} IDUser - user ID that need to be timeouted
 * @param {*} ERRORS - number of previous attempts that were incorrect
 *
 * @returns boolean isTimeout that states if user should be timeouted or not and Timeout dateTime that specifies when timeout expires
 */
const setUserTimeout = (IDUser, ERRORS) => {
  let Timeout = new Date(getDateTime());
  let isTimeout = false;

  switch (ERRORS) {
    case 0:
      break;
    case 1:
      Timeout.setSeconds(Timeout.getSeconds() + 5);
      setUserTimeoutDB(IDUser, Timeout, function (callback) {});

      isTimeout = true;
      break;
    case 2:
      Timeout.setSeconds(Timeout.getSeconds() + 10);
      setUserTimeoutDB(IDUser, Timeout, function (callback) {});

      isTimeout = true;
      break;
    case 3:
      Timeout.setSeconds(Timeout.getSeconds() + 120);
      setUserTimeoutDB(IDUser, Timeout, function (callback) {});
      isTimeout = true;

      break;

    case 4:
      Timeout = "9999-12-31 23:59:59";
      setUserTimeoutDB(IDUser, Timeout, function (callback) {});
      isTimeout = true;

      break;

    default:
      break;
  }
  return { isTimeout: isTimeout, Timeout: Timeout };
};

/**
 * calculates number of wrong login attempts and sends request to DB to set timeout in DB
 *
 * @param {*} IDUser - ID of user that is processed
 * @param {*} validation - flag if user was given acces or not
 * @param {*} userCallback - callback function
 *
 * @forvards response given by DB query
 */
const UserTimeout = (IDUser, validation, ipAddress, userCallback) => {
  getLoginAttempts(IDUser, 4, function (callback) {
    const currentDateTime = getDateTime();
    checkUserTimeoutDB(IDUser, function (Timeout) {
      if (new Date(currentDateTime) < new Date(Timeout))
        return userCallback({ isTimeout: true, Timeout: Timeout });

      let ERRORS = 0;

      if (Timeout === undefined) {
        setUserTimeoutDB(IDUser, currentDateTime, function (callback) {});
        return userCallback({ isTimeout: false, Timeout: currentDateTime });
      } else {
        for (e in callback) {
          if (callback[e].Status === "Nieudana próba logowania") {
            ERRORS += 1;
          } else {
            break;
          }
        }
      }

      if (new Date(currentDateTime) >= new Date(Timeout) && validation)
        return userCallback({ isTimeout: false, Timeout: currentDateTime });
      else if (new Date(currentDateTime) >= new Date(Timeout) && !validation) {
        let status = "Nieudana próba logowania";
        saveAttempt(
          IDUser,
          ipAddress,
          getDateTime(),
          status,
          function (callback) {}
        );
        return userCallback(setUserTimeout(IDUser, ERRORS));
      } else return userCallback(setUserTimeout(IDUser, ERRORS));
    });
  });
};

//returns formatted date and time
const getDateTime = (DATE) => {
  let date = new Date();
  if (DATE) date = new Date(DATE);
  return (
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) +
    "-" +
    (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) +
    " " +
    (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) +
    ":" +
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
    ":" +
    (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds())
  );
};

//sets up app on given port(3001)
app.listen(PORT, () => {
  console.log("Server is running");
});

module.exports = { getDateTime, saveAttempt };
