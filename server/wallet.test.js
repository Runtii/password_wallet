const encryption = require("./EncryptionHandler");

test("Testing SHA encryption", () => {
  test = "test";
  temp = encryption.encryptSHA(test);
  salt = temp.salt;
  hashed = temp.password;
  expect(encryption.validateSHA(test, salt, hashed)).toBe(true);
});

test("Testing SHA vallidation", () => {
  expect(
    encryption.validateSHA(
      "test",
      "3f6b432dd22d6a953a38ea71257ccc15",
      "adc120e4f31d5f1751c93d4353122f5b988bb6e692640019e26370c9d7d39295018877b7bd158eac9f43662485b15fcea587c0cbd0721d0ab13708508fe8f1c7"
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
