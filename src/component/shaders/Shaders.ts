import { Shader } from "../interfaces/Shader";

import { sphericalFrag } from "./spherical.fragment.glsl";
import { sphericalVert } from "./spherical.vertex.glsl";
import { fisheyeFrag } from "./fisheye.fragment.glsl";
import { fisheyeVert } from "./fisheye.vertex.glsl";
import { perspectiveFrag } from "./perspective.fragment.glsl";
import { perspectiveVert } from "./perspective.vertex.glsl";

export class Shaders {
    public static fisheye: Shader = {
        fragment: fisheyeFrag,
        vertex: fisheyeVert,
    };

    public static perspective: Shader = {
        fragment: perspectiveFrag,
        vertex: perspectiveVert,
    };

    public static spherical: Shader = {
        fragment: sphericalFrag,
        vertex: sphericalVert,
    };
}
