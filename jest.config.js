module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup/global.js"],
  testSequencer: "<rootDir>/src/tests/sequencer.js"
};
