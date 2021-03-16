import { Shader } from "../interfaces/Shader";

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
    public static equirectangular: Shader = {
        fragment: equirectangularFrag,
        vertex: equirectangularVert,
    };

    public static equirectangularCurtain: Shader = {
        fragment: equirectangularCurtainFrag,
        vertex: equirectangularCurtainVert,
    };

    public static fisheye: Shader = {
        fragment: fisheyeFrag,
        vertex: fisheyeVert,
    };

    public static fisheyeCurtain: Shader = {
        fragment: fisheyeCurtainFrag,
        vertex: fisheyeCurtainVert,
    };

    public static perspective: Shader = {
        fragment: perspectiveFrag,
        vertex: perspectiveVert,
    };

    public static perspectiveCurtain: Shader = {
        fragment: perspectiveCurtainFrag,
        vertex: perspectiveCurtainVert,
    };

    public static perspectiveDistorted: Shader = {
        fragment: perspectiveDistortedFrag,
        vertex: perspectiveDistortedVert,
    };

    public static perspectiveDistortedCurtain: Shader = {
        fragment: perspectiveDistortedCurtainFrag,
        vertex: perspectiveDistortedCurtainVert,
    };
}
