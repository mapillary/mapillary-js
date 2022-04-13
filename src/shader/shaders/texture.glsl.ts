export const vertex = /* glsl */`
#include <uniforms_vertex>
#include <varyings_vertex>

void main()
{
    #include <extrinsic_vertex>
    #include <position_vertex>
}
`;

export const fragment = /* glsl */`
#include <precision_fragment>
#include <common>
#include <uniforms_fragment>
#include <varyings_fragment>
#include <coordinates>
#expand <parameters>
#expand <uniforms>
#expand <project_to_sfm_definition>

void main()
{
    #include <bearing_fragment>
    #expand <project_to_sfm_invocation>
    #include <color_fragment>
}
`;
