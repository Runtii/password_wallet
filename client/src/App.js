import "./App.css";
import { useState, useEffect } from "react";
import Axios from "axios";

function App() {
  const [loginPage, setLoginPage] = useState(true);
  const [registerPage, setRegisterPage] = useState(false);
  const [loggedInState, setLoggedInPage] = useState(false);

  const [userID, setUserID] = useState();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isHashed, setIsHashed] = useState(null);

  const [storedPassword, setStoredPassword] = useState("");
  const [desc, setDesc] = useState("");
  const [webAddress, setAddress] = useState("");

  const [passwordListBefore, setPasswordListBefore] = useState([]);
  const [passwordList, setPasswordList] = useState([
    {
      web_address: "BRAK DANYCH",
      storedPassword: "BRAK DANYCH",
      description: "BRAK DANYCH",
    },
  ]);

  const [loginList, setLoginList] = useState([
    {
      IP: "BRAK DANYCH",
      DATETIME: "BRAK DANYCH",
      STATUS: "BRAK DANYCH",
    },
  ]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordToChange, setPasswordToChange] = useState("");
  const [isHashedNew, setIsHashedNew] = useState(null);
  const [changePasswordState, setChangePasswordState] = useState("");
  const [addPasswordMessage, setAddPasswordMessage] = useState("");

  const [ErrorMessage, setErrorMessage] = useState("");

  //makes request to log in user
  //sends username and master password given by user
  //after receiving "AUTH" response gives access to user panel with ID given by API
  const login_ = () => {
    Axios.post("http://localhost:3001/login", {
      username: username,
      password: password,
    }).then((response) => {
      if (response.data.response === "AUTH") {
        setUserID(response.data.ID);
        setErrorMessage("");
        AUTH();
      } else {
        setErrorMessage(response.data.response);
      }
    });
  };

  //registers new user
  //sends request with username, master password and flag that states if password is hashed
  //does not return anything
  const register = () => {
    Axios.post("http://localhost:3001/register", {
      username: username,
      password: password,
      isHashed: isHashed,
    });
    goToLogin();
  };

  //sends request to API to handle decryption of password that was asked to decrypt by user inside user panel
  //function handles decryption of passwords that user stores inside password wallet NOT master password
  //input hash of password to be decrypted
  //returns object with all the data same as earlier except from password which is decrypted
  const decrypt = (encryption) => {
    Axios.post("http://localhost:3001/decrypt", {
      password: encryption.storedPassword,
    }).then((response) => {
      setPasswordList(
        passwordList.map((val) => {
          return val.ID === encryption.ID
            ? {
                ID: val.ID,
                web_address: val.web_address,
                password: response.data,
                description: val.description,
              }
            : val;
        })
      );
    });
  };

  //function handles requests to API to delete instance of login attempt
  //input ID of login attempt that user wants to delete
  //outputs response message and eventual error
  const deleteLoginAttempt = (IDOfLoginAttempt) => {
    Axios.post("http://localhost:3001/deleteAttempt", {
      username: username,
      password: password,
      IDAttempt: IDOfLoginAttempt,
    }).then((response) => {
      if (response.data.response === "SUCCESS") {
        setErrorMessage(response);
        getLoginAttemptsFromDB();
      }
    });
  };

  //function handles requests to API to delete instance of password stored inside password wallet
  //input ID of password that user wants to delete
  //outputs response message and eventual error
  const deletePassword = (IDOfPassword) => {
    Axios.post("http://localhost:3001/deletePassword", {
      username: username,
      password: password,
      IDPassword: IDOfPassword,
    }).then((response) => {
      if (response.data.response === "SUCCESS") {
        setErrorMessage(response);
        getPasswordsFromDB();
      }
    });
  };

  //function handles request to add new password to be stored inside password wallet
  //right now it is also checking if password already exist
  //at the end of execution it also refreshes password list to display new password
  //TODO make refactor coz it can be split into smaller functions
  const addPassword = (storedPassword, userID, webAddress, desc) => {
    var index = [],
      i;
    for (i = 0; i < passwordList.length; i++) {
      if (passwordList[i].web_address === webAddress) index.push(i);
    }

    let isTheSame = false;
    if (index !== undefined) {
      Axios.post("http://localhost:3001/encrypt", {
        password: storedPassword,
      }).then((response) => {
        for (i = 0; i < passwordList.length; i++) {
          if (
            (response.data.encrypted === passwordList[i].password ||
              passwordList[i].password === storedPassword) &&
            passwordList[i].web_address === webAddress
          ) {
            isTheSame = true;
            break;
          }
        }

        if (storedPassword === "" || webAddress === "") {
          setAddPasswordMessage("Puste dane strony lub hasła");
        } else if (isTheSame === true) {
          setAddPasswordMessage("Hasło już istnieje w bazie danych");
        } else {
          Axios.post("http://localhost:3001/addPassword", {
            password: storedPassword,
            userID: userID,
            webAddress: webAddress,
            desc: desc,
          }).then((response) => {
            if (response.data.response === "PASSWORD ADDED")
              setAddPasswordMessage("Pomyślnie dodano hasło");
            else setAddPasswordMessage("Wystąpił błąd podczas dodawania hasła");
          });
        }
        getPasswordsFromDB();
      });
    }
  };

  //makes request to API to get passwords stored by user inside password wallet
  //input userID and master password for validation
  //output object with all the passwords stored by this user
  const getPasswordsFromDB = () => {
    Axios.post("http://localhost:3001/getPasswords", {
      userID: userID,
      password: password,
    }).then((response) => {
      if (response.data !== "") {
        setPasswordList(response.data);
        setPasswordListBefore(response.data);
      }
    });
  };

  const getLoginAttemptsFromDB = () => {
    Axios.post("http://localhost:3001/getLoginAttempts", {
      userID: userID,
      numberOfAttempts: 10,
      password: password,
    }).then((response) => {
      if (response.data !== "") {
        setLoginList(response.data);
      }
    });
  };

  //function gets stored passwords form DB at the moment of login
  useEffect(() => {
    setChangePasswordState("");
    setAddPasswordMessage("");
    if (loggedInState === true) {
      getPasswordsFromDB();
      getLoginAttemptsFromDB();
    }
  }, [loggedInState, userID, password]);

  //reverts decryption of passwords displayed to user, handles onClick
  function refreshPasswords() {
    setPasswordList(passwordListBefore);
  }

  //handles changing master password via user interface
  //input user ID, master password (for validation), new password, flag if new password should be encrypted via HMAC or SHA algorytm
  //output returns response into user view (via state)
  const changePassword = () => {
    Axios.post("http://localhost:3001/changePassword", {
      userID: userID,
      currentPassword: currentPassword,
      passwordToChange: passwordToChange,
      isHashedNew: isHashedNew,
    }).then((response) => {
      if (response.data.response === "VALIDATION ERROR")
        setChangePasswordState("Złe hasło");
      else if (response.data.response === "PASSWORD CHANGED")
        setChangePasswordState("Hasło zostało zmienione");
      else setChangePasswordState(response.data.response);
    });
  };

  //changes page that user see to be login page
  const goToLogin = () => {
    setLoginPage(true);
    setRegisterPage(false);
    setLoggedInPage(false);
    setErrorMessage("");
  };
  //changes page that user see to be register page
  const goToRegister = () => {
    setLoginPage(false);
    setRegisterPage(true);
    setLoggedInPage(false);
    setErrorMessage("");
  };
  //changes page that user see to be user panel
  const AUTH = () => {
    setLoginPage(false);
    setRegisterPage(false);
    setLoggedInPage(true);
    setErrorMessage("");
  };
  //handles change of checkbox input
  const handleChange = (e) => {
    setErrorMessage("");
    if (e.target.value) setIsHashedNew("isHashed");
    else setIsHashedNew(null);
  };

  //login
  //TODO if possible split this monstrosity into smaller parts XD
  if (loginPage === true)
    return (
      <div className="App" id="register">
        <div className="Content">
          <h1>Logowanie</h1>
          <input
            type="text"
            className="login"
            placeholder="Login"
            onChange={(event) => {
              setErrorMessage("");
              setUsername(event.target.value);
            }}
          />

          <input
            type="password"
            className="password"
            placeholder="Hasło"
            onChange={(event) => {
              setErrorMessage("");
              setPassword(event.target.value);
            }}
          />

          <button onClick={login_}>Zaloguj</button>
          <button onClick={goToRegister}>
            Przejdź do strony zakładania konta
          </button>
          <div className="ERRORBOX">{ErrorMessage}</div>
        </div>
      </div>
    );
  //register
  else if (registerPage === true)
    return (
      <div className="App" id="login">
        <div className="Content">
          <h1>Tworzenie konta</h1>
          <input
            type="text"
            className="username"
            placeholder="Login"
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />

          <input
            type="password"
            className="password"
            placeholder="Hasło"
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
          <div className="hash">
            <input
              type="checkbox"
              id="isHashed"
              name="isHashed"
              value="isHashed"
              onChange={(e) => {
                handleChange({
                  target: {
                    name: e.target.name,
                    value: e.target.checked,
                  },
                });
              }}
            />
            <label htmlFor="isHashed">
              Czy hasło ma być z solą w formie sha512?
            </label>
          </div>

          <button onClick={register}>Zarejestruj</button>
          <div className="ERRORBOX">{ErrorMessage}</div>
          <button onClick={goToLogin}>Przejdź do strony logowania</button>
        </div>
      </div>
    );
  //logged in user
  else if (loggedInState === true) {
    return (
      <div className="App">
        <div className="Content">
          <h2>Dodaj nowe hasło</h2>
          <input
            on
            type="text"
            className="newPassword"
            placeholder="Hasło"
            onChange={(event) => {
              setAddPasswordMessage("");
              setStoredPassword(event.target.value);
            }}
          />
          <input
            type="text"
            className="adres"
            placeholder="Adres strony"
            onChange={(event) => {
              setAddPasswordMessage("");
              setAddress(event.target.value);
            }}
          />
          <input
            type="text"
            className="description"
            placeholder="Opis"
            onChange={(event) => {
              setAddPasswordMessage("");
              setDesc(event.target.value);
            }}
          />
          <button
            onClick={() =>
              addPassword(storedPassword, userID, webAddress, desc)
            }
          >
            Dodaj
          </button>
          <div className="ERRORBOX">{addPasswordMessage}</div>
        </div>
        <br></br>

        <div className="Content">
          <h2>Zachowane Hasła do stron</h2>
          <table>
            <thead>
              <tr>
                <th>Strona</th>
                <th>Hasło</th>
                <th>Opis</th>
                <th>Usuń</th>
              </tr>
            </thead>
            <tbody>
              {passwordList.map((val, key) => {
                return (
                  <tr key={key}>
                    <td>{val.web_address}</td>
                    <td
                      onClick={() => {
                        decrypt({
                          ID: val.ID,
                          web_address: val.web_address,
                          storedPassword: val.password,
                          description: val.description,
                        });
                      }}
                    >
                      {val.password}
                    </td>
                    <td>{val.description ? val.description : "Brak danych"}</td>
                    <th>
                      <button
                        id="usunHaslo"
                        onClick={() => deletePassword(val.ID)}
                      >
                        Usuń
                      </button>
                    </th>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={() => refreshPasswords()}>
            Przywróć szyfrowanie
          </button>
        </div>
        <br></br>
        <div className="Content">
          <h2>Dane logowań</h2>
          <table>
            <thead>
              <tr>
                <th>IP</th>
                <th>Czas próby</th>
                <th>Status</th>
                <th>Usuń</th>
              </tr>
            </thead>
            <tbody>
              {loginList.map((val, key) => {
                return (
                  <tr key={key}>
                    <td>{val.IP}</td>
                    <td>{val.DateTime}</td>
                    <td>{val.Status}</td>
                    <th>
                      <button
                        id="usun"
                        onClick={() => deleteLoginAttempt(val.idAttempt)}
                      >
                        Usuń
                      </button>
                    </th>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <br />
        <div className="Content">
          <h2>Zmień hasło</h2>
          <input
            type="text"
            id="currentPassword"
            name="currentPassword"
            placeholder="Aktualne hasło"
            onChange={(event) => {
              setChangePasswordState("");
              setCurrentPassword(event.target.value);
            }}
          ></input>
          <label
            for="changePassword"
            id="changePasswordLabel"
            name="changePasswordLabe"
            className="ERRORBOX"
          >
            {changePasswordState}
          </label>
          <input
            type="text"
            id="newPassword"
            name="newPassword"
            placeholder="Nowe hasło"
            onChange={(event) => {
              setChangePasswordState("");
              setPasswordToChange(event.target.value);
            }}
          ></input>
          <div className="hash">
            <input
              type="checkbox"
              id="isHashed"
              name="isHashed"
              value="isHashed"
              onChange={(e) => {
                setChangePasswordState("");
                handleChange({
                  target: {
                    name: e.target.name,
                    value: e.target.checked,
                  },
                });
              }}
            />

            <label htmlFor="isHashed">
              Czy hasło ma być z solą w formie sha512?
            </label>
          </div>

          <button onClick={() => changePassword()} name="changePassword">
            Zmień hasło
          </button>
        </div>
        <br />
        <div className="Content" id="logout">
          <button onClick={() => goToLogin()}>Wyloguj</button>
        </div>
      </div>
    );
  }
}

export default App;
