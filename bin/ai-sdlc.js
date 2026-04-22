#!/usr/bin/env node

const path = require("path");
const { runCli } = require("../sdk/init");

runCli(process.argv.slice(2), {
  sourceRoot: path.resolve(__dirname, ".."),
}).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
