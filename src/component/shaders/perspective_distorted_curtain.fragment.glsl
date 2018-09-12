#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D projectorTex;
uniform float opacity;
uniform float curtain;

varying vec4 vRstq;

void main()
{
    float u = vRstq.x / vRstq.w;
    float v = vRstq.y / vRstq.w;

    vec4 baseColor;
    if ((u < curtain || curtain >= 1.0) && u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        baseColor = texture2D(projectorTex, vec2(u, v));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
}
