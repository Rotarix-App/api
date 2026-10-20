const app = require("../../index");
const connection = require("../../app/database");

global.app = app;

afterAll(async () => {
  await connection.ready;
  await connection.close();
});
