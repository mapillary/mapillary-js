#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D projectorTex;
uniform float opacity;
uniform float focal;
uniform float k1;
uniform float k2;
uniform float scale_x;
uniform float scale_y;
uniform float radial_peak;
uniform float curtain;

varying vec4 vRstq;

void main()
{
    float x = vRstq.x / vRstq.z;
    float y = vRstq.y / vRstq.z;
    float r2 = x * x + y * y;

    if (radial_peak > 0. && r2 > radial_peak * sqrt(r2)) {
        r2 = radial_peak * radial_peak;
    }

    float d = 1.0 + k1 * r2 + k2 * r2 * r2;
    float u = scale_x * focal * d * x + 0.5;
    float v = - scale_y * focal * d * y + 0.5;

    vec4 baseColor;
    if ((u < curtain || curtain >= 1.0) && u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        baseColor = texture2D(projectorTex, vec2(u, v));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
}
