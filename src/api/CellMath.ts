import { IGeometryProvider } from "./interfaces/IGeometryProvider";

export function connectedComponent(
    cellId: string,
    depth: number,
    geometry: IGeometryProvider)
    : string[] {

    const cells = new Set<string>();
    cells.add(cellId);
    connectedComponentRecursive(cells, [cellId], 0, depth, geometry);
    return Array.from(cells);
}

function connectedComponentRecursive(
    cells: Set<string>,
    current: string[],
    currentDepth: number,
    maxDepth: number,
    geometry: IGeometryProvider)
    : void {

    if (currentDepth >= maxDepth) { return; }

    const adjacent: string[] = [];
    for (const cellId of current) {
        const aCells = geometry.getAdjacent(cellId);
        adjacent.push(...aCells);
    }

    const newCells: string[] = [];
    for (const a of adjacent) {
        if (cells.has(a)) { continue; }
        cells.add(a);
        newCells.push(a);
    }

    connectedComponentRecursive(
        cells,
        newCells,
        currentDepth + 1,
        maxDepth,
        geometry);
}
