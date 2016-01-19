#ifdef GL_ES
precision highp float;
#endif

#define tau 6.28318530718

uniform sampler2D projectorTex;
uniform float opacity;
uniform float phiLength;
uniform float thetaLength;

varying vec4 vRstq;

void main()
{
    vec3 b = normalize(vRstq.xyz);
    float lat = -asin(b.y);
    float lon = atan(b.x, b.z);
    float x = lon / phiLength + 0.5;
    float y = lat / thetaLength + 0.5;
    vec4 baseColor = texture2D(projectorTex, vec2(x, y));
    baseColor.a = opacity;
    gl_FragColor = baseColor;
}