"use strict";

import express from "express";
import fs from "fs";
import path, { join } from "path";

const PORT = 8000;

const pathname = (dirname) => {
  const url = join(import.meta.url, `../${dirname}`);
  return new URL(url).pathname;
};

const logger = (req, res, next) => {
  const clearColor = "\x1b[0m";
  res.on("finish", () => {
    const color = res.statusCode === 200 ? clearColor : "\x1b[31m";
    const format = `${color}%s${clearColor}`;
    const message =
      `[${new Date().toISOString()}] ${req.method} ` +
      `${req.path} ${res.statusCode}`;
    console.log(format, message);
  });
  next();
};

const importer = (req, res, next) => {
  if (!req.path.endsWith(".js")) {
    res.sendStatus(404);
  } else {
    const file = path.join(pathname("doc/src/js"), req.path.split("/").pop());
    console.log(file);
    fs.readFile(file, "utf-8", (err, data) => {
      if (err) {
        res.sendStatus(404);
      } else {
        res.type("application/javascript");
        res.send(
          data.replace(
            " from 'mapillary-js';",
            " from '/dist/mapillary.module.js';"
          )
        );
      }
    });
  }
};

const app = express();
app.use(logger);
app.use("/doc", importer);
app.use("/dist", express.static(pathname("dist")));
app.use("/", express.static(pathname("examples")));
app.get("/examples", (_, res) => res.redirect("/"));

app.listen(PORT, () => {
  const message =
    `mapillary-js debug server running at ` + `http://localhost:${PORT}`;
  console.log(message);
});
