import * as fs from "fs";
import * as path from "path";

import {IShader} from "../../Component";

export class Shaders {
    public static equirectangular: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./equirectangular.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./equirectangular.vertex.glsl"), "utf8"),
    };

    public static equirectangularCurtain: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./equirectangular_curtain.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./equirectangular_curtain.vertex.glsl"), "utf8"),
    };

    public static perspective: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./perspective.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./perspective.vertex.glsl"), "utf8"),
    };

    public static perspectiveCurtain: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./perspective_curtain.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./perspective_curtain.vertex.glsl"), "utf8"),
    };

    public static fisheye: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./fisheye.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./fisheye.vertex.glsl"), "utf8"),
    };

    public static fisheyeCurtain: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./fisheye_curtain.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./fisheye_curtain.vertex.glsl"), "utf8"),
    };

    public static perspectiveDistorted: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./perspective_distorted.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./perspective_distorted.vertex.glsl"), "utf8"),
    };

    public static perspectiveDistortedCurtain: IShader = {
        fragment: fs.readFileSync(path.join(__dirname, "./perspective_distorted_curtain.fragment.glsl"), "utf8"),
        vertex: fs.readFileSync(path.join(__dirname, "./perspective_distorted_curtain.vertex.glsl"), "utf8"),
    };
}
