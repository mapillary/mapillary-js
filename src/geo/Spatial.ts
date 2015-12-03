/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export class Spatial {

    public rotationMatrix(angleAxis: number[]): THREE.Matrix4 {
        let axis: THREE.Vector3 =
            new THREE.Vector3(angleAxis[0], angleAxis[1], angleAxis[2]);
        let angle: number = axis.length();

        axis.normalize();

        return new THREE.Matrix4().makeRotationAxis(axis, angle);
    }
}

export default Spatial;
