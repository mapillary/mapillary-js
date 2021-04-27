import { CameraVisualizationMode } from "../enums/CameraVisualizationMode";

export class SpatialAssets {
    private readonly _colors: Map<string, string>;

    constructor() {
        this._colors = new Map();
        const cvm = CameraVisualizationMode;
        this._colors.set(cvm[cvm.Homogeneous], "#FFFFFF");
    }

    public getColor(id: string): string {
        const colors = this._colors;
        if (!colors.has(id)) { colors.set(id, this._randomColor()); }
        return colors.get(id);
    }

    private _randomColor(): string {
        return `hsl(${Math.floor(360 * Math.random())}, 100%, 50%)`;
    }
}
