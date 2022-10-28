const express = require("express");
const app = express();
const mysql = require("mysql");
const PORT = 3001;
const cors = require("cors");

const {
  encrypt,
  decrypt,
  encryptSHA,
  encryptHMAC,
  validateSHA,
} = require("./EncryptionHandler");

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "Password",
  database: "passwordwallet",
});

app.post("/addpassword", (req, res) => {
  const { password, userID, webAddress, desc } = req.body;
  if (password != null || userID != null) {
    const hashedpassword = encrypt(password);

    db.query(
      "INSERT INTO password (password,id_user,web_address,description) VALUES (?,?,?,?)",
      [hashedpassword, userID, webAddress, desc],
      (err, result) => {
        res.send({ err: "ERROR" });
      }
    );
  }
});

app.post("/getpasswords", (req, res) => {
  const { userID, password } = req.body;
  db.query(
    "SELECT password,salt,isPasswordHashed FROM users where ID = ?",
    [userID],
    (err, result1) => {
      if (err) {
        res.send({ response: "Error" });
      } else if (result1[0].isPasswordHashed == 1) {
        if (!validateSHA(password, result1[0].salt, result1[0].password)) {
          res.send("Error");
        } else {
          db.query(
            "SELECT ID,password,web_address,description FROM password where id_user = ?",
            [userID],
            (err, result2) => {
              if (err) {
                res.send({ response: "Error" });
              } else {
                res.send(result2);
              }
            }
          );
        }
      } else {
        if (toString(result1[0].password) != toString(encryptHMAC(password))) {
          res.send({ err: "Error" });
        } else {
          db.query(
            "SELECT ID,password,web_address,description FROM password where id_user = ?",
            [userID],
            (err, result2) => {
              if (err) {
                console.log(err);
              } else {
                res.send(result2);
              }
            }
          );
        }
      }
    }
  );
});

app.post("/decrypt", (req, res) => {
  res.send(decrypt(req.body.password));
});

app.post("/changePassword", (req, res) => {
  const { userID, currentPassword, passwordToChange, isHashedNew } = req.body;
  db.query(
    "SELECT password,salt,isPasswordHashed FROM users where ID = ?",
    [userID],
    (err, result) => {
      if (err) {
        res.send({ response: "ERROR" });
      } else if (result[0].isPasswordHashed != null) {
        if (!validateSHA(currentPassword, result[0].salt, result[0].password)) {
          res.send({ response: "ERROR" });
        } else {
          if (isHashedNew === "isHashed") {
            result = encryptSHA(passwordToChange);
            const encrypted = result.password;
            const salt = result.salt;
            db.query(
              "Update users SET password = ?, salt = ? , isPasswordHashed = ? where ID = ?;",
              [encrypted, salt, 1, userID],
              (err, result) => {
                if (err) res.send({ response: "ERROR" });
                else res.send({ response: "PASSWORD CHANGED" });
              }
            );
          } else {
            const encrypted = encryptHMAC(passwordToChange);
            db.query(
              "Update users SET password = ?, salt = ? , isPasswordHashed = ? where ID = ?;",
              [encrypted, null, null, userID],
              (err, result) => {
                if (err) res.send({ response: "ERROR" });
                else res.send({ response: "PASSWORD CHANGED" });
              }
            );
          }
        }
      } else {
        const encrypted = encryptHMAC(passwordToChange);
        if (toString(result[0].password) != toString(encryptHMAC(encrypted))) {
          res.send({ err: "Error" });
        } else {
          if (isHashedNew === "isHashed") {
            result = encryptSHA(passwordToChange);
            const encrypted = result.password;
            const salt = result.salt;
            db.query(
              "Update users SET password = ?, salt = ? , isPasswordHashed = ? where ID = ?;",
              [encrypted, salt, 1, userID],
              (err, result) => {
                if (err) res.send({ response: "ERROR" });
                else res.send({ response: "PASSWORD CHANGED" });
              }
            );
          } else {
            const encrypted = encryptHMAC(passwordToChange);
            db.query(
              "Update users SET password = ?, salt = ? , isPasswordHashed = ? where ID = ?;",
              [encrypted, null, null, userID],
              (err, result) => {
                if (err) {
                  res.send({ response: "ERROR" });
                } else res.send({ response: "PASSWORD CHANGED" });
              }
            );
          }
        }
      }
    }
  );
});

app.post("/register", (req, res) => {
  const { username, password, isHashed } = req.body;

  if (isHashed === "isHashed") {
    result = encryptSHA(password);
    const encrypted = result.password;
    const salt = result.salt;

    db.query(
      "INSERT INTO users (username,password,salt,isPasswordHashed) VALUES (?,?,?,?)",
      [username, encrypted, salt, 1],
      (err, result) => {
        if (err) res.send({ response: "ERROR" });
        else res.send({ response: "REGISTERED" });
      }
    );
  } else {
    const encrypted = encryptHMAC(password);
    db.query(
      "INSERT INTO users (username,password) VALUES (?,?)",
      [username, encrypted],
      (err, result) => {
        if (err) res.send({ response: "ERROR" });
        else res.send({ response: "REGISTERED" });
      }
    );
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT ID,password,salt,isPasswordHashed FROM users where username = ?",
    [username],
    (req, result) => {
      if (result[0] === undefined) {
        res.send({ response: "Podano złe dane" });
      } else {
        if (result[0].isPasswordHashed != null) {
          if (!validateSHA(password, result[0].salt, result[0].password)) {
            res.send({ response: "Podano złe dane" });
          } else {
            res.send({ response: "AUTH", ID: result[0].ID });
          }
        } else {
          if (result[0].password != encryptHMAC(password)) {
            res.send({ err: "Podano złe dane" });
          } else {
            res.send({ response: "AUTH", ID: result[0].ID });
          }
        }
      }
    }
  );
});

app.listen(PORT, () => {
  console.log("Server is running");
});
