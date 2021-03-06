export const perspectiveVert = `
#ifdef GL_ES
precision highp float;
#endif

uniform mat4 projectorMat;

varying vec4 vRstq;
varying vec4 depthColor;

#define PI 3.1415926535897932384626433832795

float inverseMix(float a, float b, float v) {
    return (v - a) / (b - a);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 depthToColor(float depth) {
    float t = inverseMix(5.0, 64.0, depth);
    float violet = 0.75;
    float red = 0.0;
    float hue = clamp(mix(violet, red, t), red, violet);
    float saturation = 1.0;
    float value = 0.7;
    vec3 hsv = vec3(hue, saturation, value);
    return vec4(hsv2rgb(hsv), 1.0);
}

void main() {
    vRstq = projectorMat * vec4(position, 1.0);
    depthColor = depthToColor(length(vRstq.xyz));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
