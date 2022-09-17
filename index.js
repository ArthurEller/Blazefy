const main = require("./src/main");
const express = require("express");

const app = express();

app.get("/", (request, response) => {
  main.run();
  return response.status(200).json("Server is up");
});
