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
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D projectorTex;
uniform float opacity;
uniform float scale_x;
uniform float scale_y;

varying vec4 vRstq;

uniform float focal;
uniform float k1;
uniform float k2;

struct Parameters {
	float focal;
	float k1;
	float k2;
};

uniform float radial_peak;

struct Uniforms {
	float radial_peak;
};

vec2 projectToSfm(const in vec3 bearing, const in Parameters parameters, const in Uniforms uniforms) {
    float focal = parameters.focal;
    float k1 = parameters.k1;
    float k2 = parameters.k2;

    float radial_peak = uniforms.radial_peak;

    float x = bearing.x / bearing.z;
    float y = bearing.y / bearing.z;
    float r2 = x * x + y * y;

    if (r2 > radial_peak * sqrt(r2)) {
        r2 = radial_peak * radial_peak;
    }

    float d = 1.0 + k1 * r2 + k2 * r2 * r2;
    float xn = focal * d * x;
    float yn = focal * d * y;

    return vec2(xn, yn);
}

void main()
{
    vec3 bearing = normalize(vRstq.xyz);
    Parameters parameters = Parameters(focal, k1, k2);
    Uniforms uniforms = Uniforms(radial_peak);
    vec2 sfm = projectToSfm(bearing, parameters, uniforms);

    float u = scale_x * sfm.x + 0.5;
    float v = - scale_y * sfm.y + 0.5;

    vec4 baseColor;
    if (u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        baseColor = texture2D(projectorTex, vec2(u, v));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
}
`;
