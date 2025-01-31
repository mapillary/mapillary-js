import { GLShader } from "../../shader/Shader";
import { fisheyeCurtainFrag } from "./shaders/fisheye_curtain.fragment.glsl";
import { fisheyeCurtainVert } from "./shaders/fisheye_curtain.vertex.glsl";
import { fisheyeFrag } from "./shaders/fisheye.fragment.glsl";
import { fisheyeVert } from "./shaders/fisheye.vertex.glsl";
import { perspectiveCurtainFrag } from "./shaders/perspective_curtain.fragment.glsl";
import { perspectiveCurtainVert } from "./shaders/perspective_curtain.vertex.glsl";
import { perspectiveDistortedCurtainFrag } from "./shaders/perspective_distorted_curtain.fragment.glsl";
import { perspectiveDistortedCurtainVert } from "./shaders/perspective_distorted_curtain.vertex.glsl";
import { perspectiveDistortedFrag } from "./shaders/perspective_distorted.fragment.glsl";
import { perspectiveDistortedVert } from "./shaders/perspective_distorted.vertex.glsl";
import { perspectiveFrag } from "./shaders/perspective.fragment.glsl";
import { perspectiveVert } from "./shaders/perspective.vertex.glsl";
import { sphericalCurtainFrag } from "./shaders/spherical_curtain.fragment.glsl";
import { sphericalCurtainVert } from "./shaders/spherical_curtain.vertex.glsl";
import { sphericalFrag } from "./shaders/spherical.fragment.glsl";
import { sphericalVert } from "./shaders/spherical.vertex.glsl";

export class SliderShaders {
    public static fisheye: GLShader = {
        fragment: fisheyeFrag,
        vertex: fisheyeVert,
    };
    public static fisheyeCurtain: GLShader = {
        fragment: fisheyeCurtainFrag,
        vertex: fisheyeCurtainVert,
    };
    public static perspective: GLShader = {
        fragment: perspectiveFrag,
        vertex: perspectiveVert,
    };
    public static perspectiveCurtain: GLShader = {
        fragment: perspectiveCurtainFrag,
        vertex: perspectiveCurtainVert,
    };
    public static perspectiveDistorted: GLShader = {
        fragment: perspectiveDistortedFrag,
        vertex: perspectiveDistortedVert,
    };
    public static perspectiveDistortedCurtain: GLShader = {
        fragment: perspectiveDistortedCurtainFrag,
        vertex: perspectiveDistortedCurtainVert,
    };
    public static spherical: GLShader = {
        fragment: sphericalFrag,
        vertex: sphericalVert,
    };
    public static sphericalCurtain: GLShader = {
        fragment: sphericalCurtainFrag,
        vertex: sphericalCurtainVert,
    };
}
