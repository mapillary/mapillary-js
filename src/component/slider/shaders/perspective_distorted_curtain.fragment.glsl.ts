import { SLIDER_CURTAIN_GLSL } from "../SliderCurtain";

export const perspectiveDistortedCurtainFrag = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D projectorTex;
uniform float opacity;
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
    float u = vRstq.x / vRstq.w;
    float v = vRstq.y / vRstq.w;
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
