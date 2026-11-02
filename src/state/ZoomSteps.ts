/**
 * Discrete zoom stops used by the zoom buttons and keyboard zoom.
 *
 * Each former power-of-two step (1x, 2x, 4x, 8x) is split in half, adding
 * the linear midpoint between neighbouring powers of two: 1x, 1.5x, 2x, 3x,
 * 4x, 6x, 8x. Zoom is logarithmic, so a magnification m is zoom log2(m).
 */
const HALF_STEP: number = Math.log2(1.5);

/**
 * Minimum logarithmic distance to the next stop. Continuous zoom (scroll,
 * pinch) can leave the camera just short of a stop; a step always moves by
 * a visible amount instead of snapping a few percent.
 */
const MIN_STEP: number = 0.2;

export function zoomStops(minZoom: number, maxZoom: number): number[] {
    const stops: number[] = [];
    for (let level = Math.ceil(minZoom); level <= maxZoom; level++) {
        stops.push(level);
        if (level + HALF_STEP < maxZoom) {
            stops.push(level + HALF_STEP);
        }
    }
    if (stops.length === 0 || stops[0] > minZoom) {
        stops.unshift(minZoom);
    }
    if (stops[stops.length - 1] < maxZoom) {
        stops.push(maxZoom);
    }
    return stops;
}

/**
 * Returns the zoom reached after moving the given number of stops from zoom.
 * Positive steps zoom in, negative steps zoom out; the result is clamped.
 */
export function stepZoom(
    zoom: number,
    steps: number,
    minZoom: number,
    maxZoom: number): number {
    const stops: number[] = zoomStops(minZoom, maxZoom);
    let target: number = Math.max(minZoom, Math.min(maxZoom, zoom));
    const direction: number = Math.sign(steps);
    for (let i = 0; i < Math.abs(Math.round(steps)); i++) {
        const next: number = direction > 0 ?
            stops.find((stop: number): boolean => stop > target + MIN_STEP) :
            [...stops].reverse().find((stop: number): boolean => stop < target - MIN_STEP);
        target = next !== undefined ?
            next : direction > 0 ? maxZoom : minZoom;
    }
    return target;
}
