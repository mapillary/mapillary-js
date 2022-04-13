import common from "./chunk/common.glsl";
import coordinates from "./chunk/coordinates.glsl";

import bearing_fragment from "./chunk/bearing_fragment.glsl";
import color_fragment from "./chunk/color_fragment.glsl";
import precision_fragment from "./chunk/precision_fragment.glsl";
import uniforms_fragment from "./chunk/uniforms_fragment.glsl";
import varyings_fragment from "./chunk/varyings_fragment.glsl";

import extrinsic_vertex from "./chunk/extrinsic_vertex.glsl";
import position_vertex from "./chunk/position_vertex.glsl";
import uniforms_vertex from "./chunk/uniforms_vertex.glsl";
import varyings_vertex from "./chunk/varyings_vertex.glsl";

// tslint:disable-next-line:variable-name
export const ShaderChunk = {
    // Definitions and functions
    common,
    coordinates,

    // Fragment
    bearing_fragment,
    color_fragment,
    precision_fragment,
    uniforms_fragment,
    varyings_fragment,

    // Vertex
    extrinsic_vertex,
    position_vertex,
    uniforms_vertex,
    varyings_vertex,
};
