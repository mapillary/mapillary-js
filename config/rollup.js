import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";

const resolveOptions = { preferBuiltins: false };

export const plugins = [sourcemaps(), resolve(resolveOptions), commonjs()];

export const umdOutput = {
  format: "umd",
  name: "mapillary",
  sourcemap: true,
};

export const srcInput = "build/esm/src/mapillary.js";

export const esm = {
  input: srcInput,
  output: [
    {
      file: "dist/mapillary.module.js",
      format: "es",
      sourcemap: true,
    },
  ],
  plugins,
};
