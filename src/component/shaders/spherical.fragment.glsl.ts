export const sphericalFrag = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define tau 6.28318530718

uniform sampler2D projectorTex;
uniform float opacity;

varying vec4 vRstq;

void main()
{
    vec3 b = normalize(vRstq.xyz);
    float lat = -asin(b.y);
    float lng = atan(b.x, b.z);
    float x = lng / tau + 0.5;
    float y = lat / tau * 2.0 + 0.5;
    vec4 baseColor = texture2D(projectorTex, vec2(x, y));
    baseColor.a = opacity;
    gl_FragColor = baseColor;
}
`
