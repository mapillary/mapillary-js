/**
 * Compute distortion given the distorted radius.
 *
 * Solves for d in the equation
 *
 *    y = d(x, k1, k2) * x
 *
 * given the distorted radius, y.
 */
export function distortionFromDistortedRadius(
    distortedRadius: number,
    k1: number,
    k2: number,
    radialPeak: number): number {

    let d = 1.0;
    for (let i = 0; i < 10; i++) {
        let radius = distortedRadius / d;
        if (radius > radialPeak) {
            radius = radialPeak;
        }
        d = 1 + k1 * radius ** 2 + k2 * radius ** 4;
    }

    return d;
}

export function makeRadialPeak(k1: number, k2: number): number {
    const a = 5 * k2;
    const b = 3 * k1;
    const c = 1;
    const d = b ** 2 - 4 * a * c;

    if (d < 0) {
        return Number.POSITIVE_INFINITY;
    }

    const root1 = (-b - Math.sqrt(d)) / 2 / a;
    const root2 = (-b + Math.sqrt(d)) / 2 / a;

    const minRoot = Math.min(root1, root2);
    const maxRoot = Math.max(root1, root2);

    return minRoot > 0 ?
        Math.sqrt(minRoot) :
        maxRoot > 0 ?
            Math.sqrt(maxRoot) :
            Number.POSITIVE_INFINITY;
}
