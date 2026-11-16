const app = require("../../index");
const connection = require("../../app/database");

global.app = app;

beforeAll(async () => {
  await connection.ready;
}, 15000);

afterAll(async () => {
  await connection.ready;
  await connection.close();
}, 15000);
