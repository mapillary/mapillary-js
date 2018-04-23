/// <reference path="../../../typings/index.d.ts" />

import * as fs from "fs";
import * as path from "path";

import {IShader} from "../../Component";

export class Shaders {
    public static equirectangular: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./equirectangular.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./equirectangular.vertex.glsl"), "utf8"),
    };
    public static perspective: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./perspective.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./perspective.vertex.glsl"), "utf8"),
    };
}
