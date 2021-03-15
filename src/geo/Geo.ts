import * as THREE from "three";

import { GeoCoords } from "./GeoCoords";
import { Spatial } from "./Spatial";
import { Transform } from "./Transform";
import { ViewportCoords } from "./ViewportCoords";
import { ILatLonAlt } from "./interfaces/ILatLonAlt";
import { CameraProjectionType } from "../api/interfaces/CameraProjectionType";

const geoCoords: GeoCoords = new GeoCoords();
const spatial: Spatial = new Spatial();

export function isSpherical(cameraType: string): boolean {
    return cameraType === "equirectangular";
}

export function computeTranslation(position: ILatLonAlt, rotation: number[], reference: ILatLonAlt): number[] {
    const C: number[] = geoCoords.geodeticToEnu(
        position.lat,
        position.lon,
        position.alt,
        reference.lat,
        reference.lon,
        reference.alt);

    const RC: THREE.Vector3 = spatial.rotate(C, rotation);
    const translation: number[] = [-RC.x, -RC.y, -RC.z];

    return translation;
}

export function computeProjectedPoints(
    transform: Transform,
    basicVertices: number[][],
    basicDirections: number[][],
    pointsPerLine: number,
    viewportCoords: ViewportCoords): number[][] {

    const basicPoints: number[][] = [];

    for (let side: number = 0; side < basicVertices.length; ++side) {
        const v: number[] = basicVertices[side];
        const d: number[] = basicDirections[side];

        for (let i: number = 0; i <= pointsPerLine; ++i) {
            basicPoints.push([v[0] + d[0] * i / pointsPerLine,
            v[1] + d[1] * i / pointsPerLine]);
        }
    }

    const camera: THREE.Camera = new THREE.Camera();
    camera.up.copy(transform.upVector());
    camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
    camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10)));
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    const projectedPoints: number[][] = basicPoints
        .map(
            (basicPoint: number[]): number[] => {
                const worldPoint: number[] = transform.unprojectBasic(basicPoint, 10000);
                const cameraPoint: number[] = viewportCoords.worldToCamera(worldPoint, camera);

                return [
                    Math.abs(cameraPoint[0] / cameraPoint[2]),
                    Math.abs(cameraPoint[1] / cameraPoint[2]),
                ];
            });

    return projectedPoints;
}
