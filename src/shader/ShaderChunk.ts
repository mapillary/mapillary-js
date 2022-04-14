import common from "./chunk/common.glsl";
import coordinates from "./chunk/coordinates.glsl";

import bearing_fragment from "./chunk/bearing_fragment.glsl";
import map_color_fragment from "./chunk/map_color_fragment.glsl";
import gl_frag_color_fragment from "./chunk/gl_frag_color_fragment.glsl";
import precision_fragment from "./chunk/precision_fragment.glsl";
import uniforms_fragment from "./chunk/uniforms_fragment.glsl";
import varyings_fragment from "./chunk/varyings_fragment.glsl";

import extrinsic_vertex from "./chunk/extrinsic_vertex.glsl";
import gl_position_vertex from "./chunk/gl_position_vertex.glsl";
import uniforms_vertex from "./chunk/uniforms_vertex.glsl";
import varyings_vertex from "./chunk/varyings_vertex.glsl";

// tslint:disable-next-line:variable-name
export const ShaderChunk = {
    // Definitions and functions
    common,
    coordinates,

    // Fragment
    bearing_fragment,
    map_color_fragment,
    gl_frag_color_fragment,
    precision_fragment,
    uniforms_fragment,
    varyings_fragment,

    // Vertex
    extrinsic_vertex,
    gl_position_vertex,
    uniforms_vertex,
    varyings_vertex,
};
