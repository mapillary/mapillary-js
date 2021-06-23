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
  const reqPath = req.path.endsWith(".js") ? req.path : `${req.path}.js`;
  const file = path.join(pathname("doc"), reqPath);
  fs.readFile(file, "utf-8", (err, data) => {
    if (err) {
      res.sendStatus(404);
    } else {
      data = data.replace("import mapboxgl from 'mapbox-gl';", "");

      const relative = /(\sfrom\s\'\.\/.*)(';)/g;
      data = data.replaceAll(relative, (match, p1, p2) => {
        return [p1, ".js';"].join("");
      });

      const mapillary = /\sfrom\s\'.*\/mapillary.module\';/;
      data = data.replace(mapillary, " from '/dist/mapillary.module.js';");

      const mods = /(?!.*mapillary)(.*)(\sfrom\s\'.*\/mods\/)(.*)(';)/g;
      function replacer(match, p1, _, p3, __) {
        return [p1, " from '/mods/", p3, ".js';"].join("");
      }
      data = data.replaceAll(mods, replacer);

      res.type("application/javascript");
      res.send(data);
    }
  });
};

const app = express();
app.use(logger);
app.use("/doc-css", express.static(pathname("doc/src/css")));
app.use("/doc-src", importer);
app.use("/dist", express.static(pathname("dist")));
app.use("/doc", express.static(pathname("examples/doc")));
app.use(
  "/mods",
  express.static(pathname("node_modules")),
  express.static(pathname("doc/node_modules"))
);
app.use("/", express.static(pathname("examples/debug")));

app.listen(PORT, () => {
  const message =
    `mapillary-js debug server running at ` + `http://localhost:${PORT}`;
  console.log(message);
});
