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
    float x = vRstq.x;
    float y = vRstq.y;
    float z = vRstq.z;

    float r2 = sqrt(x * x + y * y);
    float theta = atan(r2, z);

    if (radial_peak > 0. && theta > radial_peak) {
        theta = radial_peak;
    }

    float theta2 = theta * theta;
    float theta_d = theta * (1.0 + theta2 * (k1 + theta2 * k2));
    float s = focal * theta_d / r2;

    float u = scale_x * s * x + 0.5;
    float v = -scale_y * s * y + 0.5;

    vec4 baseColor;
    if ((u < curtain || curtain >= 1.0) && u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        baseColor = texture2D(projectorTex, vec2(u, v));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
}
