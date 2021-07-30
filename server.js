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
    const color = res.statusCode < 400 ? clearColor : "\x1b[31m";
    const format = `${color}%s${clearColor}`;
    const message =
      `[${new Date().toISOString()}] ${req.method} ` +
      `${req.originalUrl} ${res.statusCode}`;
    console.log(format, message);
  });
  next();
};

const importer = (basepath) => {
  return (req, res, next) => {
    const reqPath = req.path.endsWith(".js") ? req.path : `${req.path}.js`;
    const file = path.join(pathname(basepath), reqPath);
    fs.readFile(file, "utf-8", (err, data) => {
      if (err) {
        res.sendStatus(404);
      } else {
        const mapbox = "import mapboxgl from 'mapbox-gl';";
        data = data.replace(mapbox, "");

        const threeExamples = /(\sfrom\s\')(three\/examples\/)(.*)(';)/g;
        function replacer(match, p1, p2, p3, __) {
          return [p1, "/node_modules/", p2, p3, ".js';"].join("");
        }
        data = data.replace(threeExamples, replacer);

        const three = /\sfrom\s\'three\';/;
        data = data.replace(
          three,
          " from '/node_modules/three/build/three.module.js';"
        );

        const mapillary =
          /\sfrom\s\'..\/..\/mapillary-js\/dist\/mapillary.module\';/;
        data = data.replace(mapillary, " from '/dist/mapillary.module.js';");

        const relative = /(\sfrom\s\'\.\/.*)(';)/g;
        data = data.replace(relative, (match, p1, p2) => {
          return [p1, ".js';"].join("");
        });

        res.type("application/javascript");
        res.send(data);
      }
    });
  };
};

const app = express();
app.use(logger);
app.use("/doc-css", express.static(pathname("doc/src/css")));
app.use("/doc-src", importer("doc"));
app.use("/dist", express.static(pathname("dist")));
app.use("/doc", express.static(pathname("examples/doc")));
app.use(
  "/node_modules/three/examples",
  importer("node_modules/three/examples")
);
app.use(
  "/node_modules",
  express.static(pathname("node_modules")),
  express.static(pathname("doc/node_modules"))
);
app.use("/", express.static(pathname("examples/debug")));

app.listen(PORT, () => {
  const message =
    `mapillary-js debug server running at ` + `http://localhost:${PORT}`;
  console.log(message);
});
