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
  const [passwordList, setPasswordList] = useState([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordToChange, setPasswordToChange] = useState("");
  const [isHashedNew, setIsHashedNew] = useState(null);
  const [changePasswordState, setChangePasswordState] = useState("");

  const [ErrorMessage, setErrorMessage] = useState("");

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

  const register = () => {
    Axios.post("http://localhost:3001/register", {
      username: username,
      password: password,
      isHashed: isHashed,
    });
  };

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

  const addPassword = (storedPassword, userID, webAddress, desc) => {
    Axios.post("http://localhost:3001/addpassword", {
      password: storedPassword,
      userID: userID,
      webAddress: webAddress,
      desc: desc,
    });
  };

  useEffect(() => {
    if (loggedInState === true) {
      Axios.post("http://localhost:3001/getpasswords", {
        userID: userID,
        password: password,
      }).then((response) => {
        if (response.data !== "Error") {
          setPasswordList(response.data);
          setPasswordListBefore(response.data);
        }
      });
    }
  }, [loggedInState, userID, password]);

  function refreshPasswords() {
    setPasswordList(passwordListBefore);
  }
  const changePassword = () => {
    Axios.post("http://localhost:3001/changePassword", {
      userID: userID,
      currentPassword: currentPassword,
      passwordToChange: passwordToChange,
      isHashedNew: isHashedNew,
    }).then((response) => {
      setChangePasswordState(response.data.response);
    });
  };
  const Logout = () => {
    setLoginPage(true);
    setRegisterPage(false);
    setLoggedInPage(false);
  };

  const goToRegister = () => {
    setLoginPage(false);
    setRegisterPage(true);
    setLoggedInPage(false);
  };

  const goToLogin = () => {
    setLoginPage(true);
    setRegisterPage(false);
    setLoggedInPage(false);
  };
  const AUTH = () => {
    setLoginPage(false);
    setRegisterPage(false);
    setLoggedInPage(true);
  };

  const handleChange = (e) => {
    if (e.target.value) setIsHashedNew("isHashed");
    else setIsHashedNew(null);
  };
  const handleChangeREG = (e) => {
    if (e.target.value) setIsHashedNew("isHashed");
    else setIsHashedNew(null);
  };

  //login
  if (loginPage === true)
    return (
      <div className="App">
        <div className="Content">
          <h1>Logowanie</h1>
          <input
            type="text"
            className="login"
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
      <div className="App">
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
                handleChangeREG({
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
          <button onClick={goToLogin}> Przejdź do strony logowania</button>
        </div>
      </div>
    );
  //logged in user
  else if (loggedInState === true) {
    return (
      <div className="App">
        <div className="Content">
          <input
            type="text"
            className="newPassword"
            placeholder="Hasło"
            onChange={(event) => {
              setStoredPassword(event.target.value);
            }}
          />
          <input
            type="text"
            className="adres"
            placeholder="Adres strony"
            onChange={(event) => {
              setAddress(event.target.value);
            }}
          />
          <input
            type="text"
            className="description"
            placeholder="Opis"
            onChange={(event) => {
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
        </div>
        <br></br>
        <div className="Content">
          <table>
            <thead>
              <tr>
                <th>Strona</th>
                <th>Hasło</th>
                <th>Opis</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={() => refreshPasswords()}>
            Przywróć szyfrowanie
          </button>
        </div>
        <br />
        <div className="Content">
          <input
            type="text"
            id="currentPassword"
            name="currentPassword"
            placeholder="Aktualne hasło"
            onChange={(event) => {
              setCurrentPassword(event.target.value);
            }}
          ></input>
          <input
            type="text"
            id="newPassword"
            name="newPassword"
            placeholder="Nowe hasło"
            onChange={(event) => {
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
          <label
            for="changePassword"
            id="changePasswordLabel"
            name="changePasswordLabe"
          >
            {changePasswordState}
          </label>
        </div>
        <br />
        <div className="Content">
          <button onClick={() => Logout()}>Wyloguj</button>
        </div>
      </div>
    );
  }
}

export default App;
