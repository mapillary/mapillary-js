import { SLIDER_CURTAIN_GLSL } from "../SliderCurtain";

export const fisheyeCurtainFrag = `
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
uniform bool screenSpace;
${SLIDER_CURTAIN_GLSL}
varying vec4 vClipPosition;
varying vec4 vRstq;
void main()
{
    // Homogeneous clip coordinates give the exact visible screen fraction,
    // independent of lens projection, image pose, roll or panorama wrapping.
    float screenX = (vClipPosition.x / vClipPosition.w + 1.0) * 0.5;
    float curtainAlpha = screenSpace ? sliderCurtainAlpha(screenX) : 1.0;
    if (curtainAlpha <= 0.0) {
        discard;
    }
    float x = vRstq.x;
    float y = vRstq.y;
    float z = vRstq.z;
    if (z <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }
    float r2 = sqrt(x * x + y * y);
    float theta = atan(r2, z);
    if (radial_peak > 0. && theta > radial_peak) {
        theta = radial_peak;
    }
    float theta2 = theta * theta;
    float theta_d = theta * (1.0 + theta2 * (k1 + theta2 * k2));
    float s = r2 > 0.0 ? focal * theta_d / r2 : 0.0;
    float u = scale_x * s * x + 0.5;
    float v = -scale_y * s * y + 0.5;
    vec4 baseColor;
    if ((screenSpace || u < curtain || curtain >= 1.0) && u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        baseColor = texture2D(projectorTex, vec2(u, v));
        baseColor.a = opacity * curtainAlpha;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
    gl_FragColor = baseColor;
}
`
