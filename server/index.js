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
  removePermBan,
  deleteLoginAttempt,
  deletePassword,
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

app.post("/deletePassword", (req, res) => {
  const { username, password, IDPassword } = req.body;

  getUserCredentialsByUsername(username, function (credentials) {
    const validation = validatePassword(
      password,
      credentials[0].password,
      credentials[0].salt
    );
    if (validation) {
      deletePassword(IDPassword, function (callback) {
        res.send(callback);
      });
    } else res.send({ response: "ERROR" });
  });
});

//gets passwords from DB saved by user, first it validates user then returns passwords
//input user id and user master password for validation
//returns object with response as string message
app.post("/getPasswords", (req, res) => {
  const { userID, password } = req.body;
  getUserCredentialsByID(userID, function (credentials) {
    if (
      validatePassword(password, credentials[0].password, credentials[0].salt)
    )
      getPasswords(userID, function (resultOfGetPassword) {
        res.send(resultOfGetPassword);
      });
    else res.send({ response: "ERROR" });
  });
});

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
      validatePassword(
        currentPassword,
        credentials[0].password,
        credentials[0].salt
      )
    ) {
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
    } else res.send({ response: "VALIDATION ERROR" });
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
    if (credentials[0] === undefined) res.send({ response: "Podano złe dane" });
    else {
      const validation = validatePassword(
        password,
        credentials[0].password,
        credentials[0].salt
      );
      UserTimeout(credentials[0].ID, validation, function (TimeoutResult) {
        let isTimeout = false;
        isTimeout = TimeoutResult.isTimeout;
        const Timeout = TimeoutResult.Timeout;
        if (isTimeout == false) {
          if (validation) {
            status = "Pomyślne logowanie";
            res.send({ response: "AUTH", ID: credentials[0].ID });
          } else {
            status = "Nieudana próba logowania";
            res.send({ response: "Podano złe dane" });
          }
          saveAttempt(
            credentials[0].ID,
            ipAddress,
            getDateTime(),
            status,
            function (callback) {}
          );
        } else {
          status = "Nieudana próba logowania";
          saveAttempt(
            credentials[0].ID,
            ipAddress,
            getDateTime(),
            status,
            function (callback) {}
          );
          res.send({
            response:
              "Złe dane!\n Masz zablokowaną możliwość logowania do " +
              getDateTime(Timeout),
          });
        }
      });
    }
  });
});

//saves login attempt into DB
//returns status (only for testing)
const saveAttempt = (ID, ipAddress, DateTime, status, callbackATT) => {
  insertNewLoginAttempt(ID, ipAddress, DateTime, status, function (callback) {
    callbackATT(callback.response);
  });
};

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

const UserTimeout = (IDUser, validation, userCallback) => {
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
      else return userCallback(setUserTimeout(IDUser, ERRORS));
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
