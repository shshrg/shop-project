const serverless = require("serverless-http");
const express = require("express");
const app = express();

exports.hello = async () => {
  return "Hello World!";
};

