/**
 * Screen-space curtain with an optional soft edge.
 *
 * Shared GLSL for the curtain shaders; must follow the `curtain` uniform.
 * With `curtainFeather` 0 it is exactly the original hard rule (hidden at
 * <=0, full at >=1, otherwise visible left of the curtain). A positive
 * feather blends the foreground out over +/- feather (fraction of viewport
 * width) around the curtain, so small misalignments read as a soft seam.
 */
export const SLIDER_CURTAIN_GLSL = `
uniform float curtainFeather;
float sliderCurtainAlpha(float screenX) {
    if (curtain <= 0.0) {
        return 0.0;
    }
    if (curtain >= 1.0) {
        return 1.0;
    }
    if (curtainFeather > 0.0) {
        return 1.0 - smoothstep(curtain - curtainFeather, curtain + curtainFeather, screenX);
    }
    return screenX < curtain ? 1.0 : 0.0;
}
`;

/** Valid soft-edge half width: 0 (hard) up to 0.1 of the viewport width. */
export function sliderCurtainFeather(feather: unknown): number {
    return typeof feather === "number" && Number.isFinite(feather) ? Math.max(0, Math.min(0.1, feather)) : 0;
}
