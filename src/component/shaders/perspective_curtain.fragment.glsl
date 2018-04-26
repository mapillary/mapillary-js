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
    float x = vRstq.x / vRstq.w;
    float y = vRstq.y / vRstq.w;

    vec4 baseColor;
    if (x < curtain || curtain >= 1.0) {
        baseColor = texture2D(projectorTex, vec2(x, y));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
}
