export function isClockwise(polygon: number[][]): boolean {
    if (polygon.length < 3) { return false; };
    let edgeSum = 0;
    for (let i = 0; i < polygon.length; ++i) {
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[(i + 1) % polygon.length];
        edgeSum += (x2 - x1) * (y2 + y1);
    }
    return edgeSum > 0;
}
