import * as THREE from "three";

import { Spatial } from "./Spatial";
import { Transform } from "./Transform";
import { ViewportCoords } from "./ViewportCoords";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { geodeticToEnu } from "./GeoCoords";

const spatial = new Spatial();

export function isSpherical(cameraType: string): boolean {
    return cameraType === "spherical";
}

export function isFisheye(cameraType: string): boolean {
    return cameraType === "fisheye";
}

export function computeTranslation(position: LngLatAlt, rotation: number[], reference: LngLatAlt): number[] {
    const C = geodeticToEnu(
        position.lng,
        position.lat,
        position.alt,
        reference.lng,
        reference.lat,
        reference.alt);

    const RC: THREE.Vector3 = spatial.rotate(C, rotation);
    const translation: number[] = [-RC.x, -RC.y, -RC.z];

    return translation;
}

export function computeBearings(
    transform: Transform,
    basicVertices: number[][],
    basicDirections: number[][],
    pointsPerLine: number,
    viewportCoords: ViewportCoords): number[][] {

    // @ts-ignore
    const camera: THREE.Camera = new THREE.Camera();
    camera.up.copy(transform.upVector());
    camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
    camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10)));

    return computeCameraBearings(
        camera,
        transform,
        basicVertices,
        basicDirections,
        pointsPerLine,
        viewportCoords);
}

export function computeCameraBearings(
    camera: THREE.Camera,
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
            basicPoints.push([
                v[0] + d[0] * i / pointsPerLine,
                v[1] + d[1] * i / pointsPerLine,
            ]);
        }
    }

    camera.updateMatrix();
    camera.updateMatrixWorld(true);
    const bearings: number[][] = [];
    for (const basicPoint of basicPoints) {
        const worldPoint = transform.unprojectBasic(basicPoint, 10000);
        const cameraPoint = new THREE.Vector3()
            .fromArray(viewportCoords.worldToCamera(worldPoint, camera));
        cameraPoint.normalize();
        bearings.push(cameraPoint.toArray());
    }

    return bearings;
}

export function computeProjectedPoints(
    transform: Transform,
    basicVertices: number[][],
    basicDirections: number[][],
    pointsPerLine: number,
    viewportCoords: ViewportCoords): number[][] {

    // @ts-ignore
    const camera: THREE.Camera = new THREE.Camera();
    camera.up.copy(transform.upVector());
    camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
    camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10)));
    camera.updateMatrix();
    camera.updateMatrixWorld(true);


    const basicPoints: number[][] = [];

    for (let side: number = 0; side < basicVertices.length; ++side) {
        const v: number[] = basicVertices[side];
        const d: number[] = basicDirections[side];

        for (let i: number = 0; i <= pointsPerLine; ++i) {
            basicPoints.push([
                v[0] + d[0] * i / pointsPerLine,
                v[1] + d[1] * i / pointsPerLine,
            ]);
        }
    }


    const projectedPoints: number[][] = [];
    for (const [index, basicPoint] of basicPoints.entries()) {
        const worldPoint = transform.unprojectBasic(basicPoint, 10000);
        const cameraPoint = viewportCoords.worldToCamera(worldPoint, camera);
        if (cameraPoint[2] > 0) {
            continue;
        }

        projectedPoints.push([
            cameraPoint[0] / cameraPoint[2],
            cameraPoint[1] / cameraPoint[2],
            index,
        ]);
    }


    return projectedPoints;
}

export function computeProjectedPointsSafe(
    transform: Transform,
    basicVertices: number[][],
    basicDirections: number[][],
    pointsPerLine: number,
    viewportCoords: ViewportCoords): number[][] {

    // @ts-ignore
    const camera: THREE.Camera = new THREE.Camera();
    camera.up.copy(transform.upVector());
    camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
    camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10)));
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    const projectedPoints: number[][] = [];
    for (let side: number = 0; side < basicVertices.length; ++side) {
        const v: number[] = basicVertices[side];
        const d: number[] = basicDirections[side];

        for (let i: number = 0; i <= pointsPerLine; ++i) {
            const basicPoint = [
                v[0] + d[0] * i / pointsPerLine,
                v[1] + d[1] * i / pointsPerLine,
            ];
            const worldPoint = transform.unprojectBasic(basicPoint, 10000);
            const cameraPoint = viewportCoords.worldToCamera(worldPoint, camera);
            if (cameraPoint[2] > 0) {
                break;
            }

            projectedPoints.push([
                cameraPoint[0] / cameraPoint[2],
                cameraPoint[1] / cameraPoint[2],
            ]);
        }
    }

    return projectedPoints;
}
