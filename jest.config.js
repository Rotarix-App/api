module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.js"],
  globalSetup: "<rootDir>/src/tests/setup/database.js",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup/global.js"],
  testSequencer: "<rootDir>/src/tests/sequencer.js"
};
