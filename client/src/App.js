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
  const [isHashed, setIsHashed] = useState("");

  const [storedPassword, setStoredPassword] = useState("");
  const [desc, setDesc] = useState("");
  const [webAddress, setAddress] = useState("");

  const [passwordListBefore, setPasswordListBefore] = useState([]);
  const [passwordList, setPasswordList] = useState([]);

  const [ErrorMessage, setErrorMessage] = useState("");

  const login_ = () => {
    Axios.post("http://localhost:3001/login", {
      username: username,
      password: password,
    }).then((response) => {
      if (response.data.response == "AUTH") {
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
    if (loggedInState == true)
      Axios.post("http://localhost:3001/getpasswords", {
        userID: userID,
        masterPassword: password,
      }).then((response) => {
        if (response.data != "Error") {
          setPasswordList(response.data);
          setPasswordListBefore(response.data);
        }
      });
  }, [userID, password]);

  function refreshPage() {
    setPasswordList(passwordListBefore);
  }

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

  //logowanie
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
          <a onClick={goToRegister}> Przejdź do strony zakładania konta</a>
          <div className="ERRORBOX">{ErrorMessage}</div>
        </div>
      </div>
    );
  //rejestracja
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
              onChange={(event) => {
                setIsHashed(event.target.value);
              }}
            />
            <label htmlFor="isHashed">
              Czy hasło ma być z solą w formie sha512?
            </label>
          </div>

          <button onClick={register}>Zarejestruj</button>
          <a onClick={goToLogin}> Przejdź do strony logowania</a>
        </div>
      </div>
    );
  //zalogowany user
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
        <table className="Content">
          <thead>
            <tr>
              <th>ID</th>
              <th>Strona</th>
              <th>Hasło</th>
              <th>Opis</th>
            </tr>
          </thead>

          {passwordList.map((val, key) => {
            return (
              <tbody key={key}>
                <tr>
                  <td>{val.ID}</td>
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
              </tbody>
            );
          })}
        </table>
        <button onClick={() => refreshPage()}>Przywróć szyfrowanie</button>
        <br></br>
        <div className="Content">
          <button onClick={() => Logout()}>Wyloguj</button>
        </div>
      </div>
    );
  }
}

export default App;
