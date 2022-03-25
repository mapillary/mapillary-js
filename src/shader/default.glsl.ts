export const vertex = /* glsl */`
uniform mat4 projectorMat;

varying vec4 vRstq;

void main()
{
    vRstq = projectorMat * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragment = /* glsl */`
#include <precision_fragment>
#include <common>

uniform sampler2D projectorTex;
uniform float opacity;
uniform float scale_x;
uniform float scale_y;
varying vec4 vRstq;

#expand <parameters>
#expand <uniforms>

#include <coordinates>
#expand <project_to_sfm_definition>

void main()
{
    vec3 bearing = normalize(vRstq.xyz);

    #expand <project_to_sfm_invocation>

    vec2 uv = sfmToUv(sfm, vec2(scale_x, scale_y));

    #include <color_fragment>
}
`;
