const encryption = require("./EncryptionHandler");
const API = require("./index");
const request = require("supertest");
const baseURL = "http://localhost:3001";

test("Testing SHA encryption", () => {
  test = "test";
  temp = encryption.encryptSHA(test);
  salt = temp.salt;
  hashed = temp.password;
  expect(encryption.validateSHA(test, hashed, salt)).toBe(true);
});

test("Testing SHA vallidation", () => {
  expect(
    encryption.validateSHA(
      "test",
      "adc120e4f31d5f1751c93d4353122f5b988bb6e692640019e26370c9d7d39295018877b7bd158eac9f43662485b15fcea587c0cbd0721d0ab13708508fe8f1c7",
      "3f6b432dd22d6a953a38ea71257ccc15"
    )
  ).toBe(true);
});

test("Testing HMAC encryption", () => {
  expect(encryption.encryptHMAC("test")).toBe(
    "c8a65a5067331c6fb2356fff51be739d35401ac3f417bd7ee6e040bccb96946a"
  );
});

test("Testing encryption to DB", () => {
  expect(encryption.encrypt("test")).toBe("bY2XI0uTV9yu0km9z67Bpw==");
});

test("Testing decryption from DB", () => {
  expect(encryption.decrypt("bY2XI0uTV9yu0km9z67Bpw==")).toBe("test");
});

//new tests

describe("POST /login", () => {
  const loginAdmin = {
    username: "admin",
    password: "admin",
  };
  const badPassword = {
    username: "admin",
    password: "tak",
  };
  const nonExistingUser = {
    username: "adam",
    password: "tak",
  };

  it("should return AUTH when logged in", async () => {
    const response = await request(baseURL).post("/login").send(loginAdmin);

    const body = response.body;

    expect(body.response).toBe("AUTH");
    expect(body.ID).toBe(116);
  });
  it('should return "Podano złe dane" when bad password was given', async () => {
    const response = await request(baseURL).post("/login").send(badPassword);

    const body = response.body;

    expect(body.response).toBe("Podano złe dane");
  });
  it('should return "Podano złe dane" when user does not exist', async () => {
    const response = await request(baseURL)
      .post("/login")
      .send(nonExistingUser);

    const body = response.body;

    expect(body.response).toBe("Podano złe dane");
  });
});

describe("POST /encrypt", () => {
  const plainPassword = { password: "testowy tekst" };
  it("should return hash of plain password to be inserted into DB (password that user stores)", async () => {
    const response = await request(baseURL)
      .post("/encrypt")
      .send(plainPassword);
    expect(response.body.encrypted).toBe("7OzgnDZ6hwPRhjbHR+n0KA==");
  });
});

describe("POST /decrypt", () => {
  const hashedPassword = { password: "7OzgnDZ6hwPRhjbHR+n0KA==" };
  it("should return plain password (password that user stores)", async () => {
    const response = await request(baseURL)
      .post("/decrypt")
      .send(hashedPassword);
    expect(response.text).toBe("testowy tekst");
  });
});

test("Testing insertion of new login attempt", () => {
  API.saveAttempt(
    0,
    "127:0:0:1",
    API.getDateTime(),
    "TESTOWE LOGOWANIE",
    function (callback) {
      expect(callback).toBe("SUCCESS");
    }
  );
});
