export const sphericalCurtainFrag = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define tau 6.28318530718

uniform sampler2D projectorTex;
uniform float curtain;
uniform float opacity;

varying vec4 vRstq;

void main()
{
    vec3 b = normalize(vRstq.xyz);
    float lat = -asin(b.y);
    float lng = atan(b.x, b.z);
    float x = lng / tau + 0.5;
    float y = lat / tau * 2.0 + 0.5;

    bool inverted = curtain < 0.5;

    float curtainMin = inverted ? curtain + 0.5 : curtain - 0.5;
    float curtainMax = curtain;

    bool insideCurtain = inverted ?
        x > curtainMin || x < curtainMax :
        x > curtainMin && x < curtainMax;

    vec4 baseColor;
    if (insideCurtain) {
        baseColor = texture2D(projectorTex, vec2(x, y));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
}
`
