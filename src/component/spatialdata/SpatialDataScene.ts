import * as THREE from "three";

export class SpatialDataScene {
    private _needsRender: boolean;
    private _scene: THREE.Scene;

    constructor(scene?: THREE.Scene) {
        this._needsRender = false;
        this._scene = !!scene ? scene : new THREE.Scene();
    }
}

export default SpatialDataScene;
