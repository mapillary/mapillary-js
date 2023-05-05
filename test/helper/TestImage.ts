import { Image } from "../../src/graph/Image";
import { MeshContract } from "../../src/api/contracts/MeshContract";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";


export class TestImage extends Image {
    private _mesh: MeshContract;

    constructor(core: CoreImageEnt) {
        super(core);
    }

    public get assetsCached(): boolean {
        return true;
    }

    public get image(): HTMLImageElement {
        return null;
    }

    public get mesh(): MeshContract {
        return this._mesh;
    }

    public set mesh(value: MeshContract) {
        this._mesh = value;
    }
}
