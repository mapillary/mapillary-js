import * as THREE from "three";

import {Spatial} from "../../src/Geo";

export class GeoHelper {
    private spatial: Spatial = new Spatial();

    public getTranslation(r: number[], C: number[]): number[] {
        let R: THREE.Matrix4 = this.spatial.rotationMatrix(r);
        let t: number[] = new THREE.Vector3().fromArray(C).applyMatrix4(R).multiplyScalar(-1).toArray();

        return t;
    }
}
