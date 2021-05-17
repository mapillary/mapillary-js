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
      `${req.originalUrl} ${res.statusCode}`;
    console.log(format, message);
  });
  next();
};

const importer = (req, res, next) => {
  if (!req.path.endsWith(".js")) {
    res.sendStatus(404);
  } else {
    const relativePath = req.path.split("/").slice(-2).join("/");
    const file = path.join(pathname("doc/src/js"), relativePath);
    fs.readFile(file, "utf-8", (err, data) => {
      if (err) {
        res.sendStatus(404);
      } else {
        const mapillary = / from (\"|\').*\/mapillary.module(\"|\');/;
        data = data.replace(mapillary, " from '/dist/mapillary.module.js';");

        const mods = /(?!.*mapillary)(.*)(\sfrom\s\'.*\/mods\/)(.*)(';)/;
        function replacer(match, p1, _, p3, __) {
          return [p1, " from '/mods/", p3, ".js';"].join("");
        }
        data = data.replace(mods, replacer);

        res.type("application/javascript");
        res.send(data);
      }
    });
  }
};

const app = express();
app.use(logger);
app.use("/doc-src", importer);
app.use("/dist", express.static(pathname("dist")));
app.use("/doc", express.static(pathname("examples/doc")));
app.use("/mods", express.static(pathname("node_modules")));
app.use("/", express.static(pathname("examples/debug")));

app.listen(PORT, () => {
  const message =
    `mapillary-js debug server running at ` + `http://localhost:${PORT}`;
  console.log(message);
});
