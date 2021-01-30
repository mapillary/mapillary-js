import { IShader } from "../interfaces/IShader";

import { equirectangularFrag } from "./equirectangular.fragment.glsl";
import { equirectangularVert } from "./equirectangular.vertex.glsl";
import { equirectangularCurtainFrag } from "./equirectangular_curtain.fragment.glsl";
import { equirectangularCurtainVert } from "./equirectangular_curtain.vertex.glsl";
import { fisheyeFrag } from "./fisheye.fragment.glsl";
import { fisheyeVert } from "./fisheye.vertex.glsl";
import { fisheyeCurtainFrag } from "./fisheye_curtain.fragment.glsl";
import { fisheyeCurtainVert } from "./fisheye_curtain.vertex.glsl";
import { perspectiveFrag } from "./perspective.fragment.glsl";
import { perspectiveVert } from "./perspective.vertex.glsl";
import { perspectiveCurtainFrag } from "./perspective_curtain.fragment.glsl";
import { perspectiveCurtainVert } from "./perspective_curtain.vertex.glsl";
import { perspectiveDistortedFrag } from "./perspective_distorted.fragment.glsl";
import { perspectiveDistortedVert } from "./perspective_distorted.vertex.glsl";
import { perspectiveDistortedCurtainFrag } from "./perspective_distorted_curtain.fragment.glsl";
import { perspectiveDistortedCurtainVert } from "./perspective_distorted_curtain.vertex.glsl";


export class Shaders {
    public static equirectangular: IShader = {
        fragment: equirectangularFrag,
        vertex: equirectangularVert,
    };

    public static equirectangularCurtain: IShader = {
        fragment: equirectangularCurtainFrag,
        vertex: equirectangularCurtainVert,
    };

    public static fisheye: IShader = {
        fragment: fisheyeFrag,
        vertex: fisheyeVert,
    };

    public static fisheyeCurtain: IShader = {
        fragment: fisheyeCurtainFrag,
        vertex: fisheyeCurtainVert,
    };

    public static perspective: IShader = {
        fragment: perspectiveFrag,
        vertex: perspectiveVert,
    };

    public static perspectiveCurtain: IShader = {
        fragment: perspectiveCurtainFrag,
        vertex: perspectiveCurtainVert,
    };

    public static perspectiveDistorted: IShader = {
        fragment: perspectiveDistortedFrag,
        vertex: perspectiveDistortedVert,
    };

    public static perspectiveDistortedCurtain: IShader = {
        fragment: perspectiveDistortedCurtainFrag,
        vertex: perspectiveDistortedCurtainVert,
    };
}
