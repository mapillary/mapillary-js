import { CameraVisualizationMode } from "../enums/CameraVisualizationMode";

export class SpatialAssets {
    private readonly _colors: Map<string, number | string>;

    constructor() {
        this._colors = new Map();
        const cvm = CameraVisualizationMode;
        this._colors.set(cvm[cvm.Homogeneous], "#FFFFFF");
    }

    public getColor(id: string): number | string {
        const colors = this._colors;
        if (!colors.has(id)) {
            colors.set(id, this._randomColor());
        }
        return colors.get(id);
    }

    private _randomColor(): number | string {
        return `hsl(${Math.floor(360 * Math.random())}, 100%, 60%)`;
    }
}
