/// <reference path="../../../typings/node/node.d.ts" />

import * as fs from "fs";
import * as path from "path";

import {IShader} from "../../UI";

export class Shaders {
    public static equirectangular: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./shaders/equirectangular.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./shaders/equirectangular.vertex.glsl"), "utf8"),
    };
    public static perspective: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./shaders/perspective.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./shaders/perspective.vertex.glsl"), "utf8"),
    };
}
