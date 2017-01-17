/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Transform} from "../Geo";

/**
 * @class ViewportCoords
 */
export class ViewportCoords {
    public getBasicDistances(transform: Transform, perspectiveCamera: THREE.PerspectiveCamera): number[] {
        let topLeft: THREE.Vector3 = new THREE.Vector3(-1, 1, 1).unproject(perspectiveCamera);
        let topLeftBasic: number[] = transform.projectBasic([topLeft.x, topLeft.y, topLeft.z]);

        let topRight: THREE.Vector3 = new THREE.Vector3(1, 1, 1).unproject(perspectiveCamera);
        let topRightBasic: number[] = transform.projectBasic([topRight.x, topRight.y, topRight.z]);

        let bottomRight: THREE.Vector3 = new THREE.Vector3(1, -1, 1).unproject(perspectiveCamera);
        let bottomRightBasic: number[] = transform.projectBasic([bottomRight.x, bottomRight.y, bottomRight.z]);

        let bottomLeft: THREE.Vector3 = new THREE.Vector3(-1, -1, 1).unproject(perspectiveCamera);
        let bottomLeftBasic: number[] = transform.projectBasic([bottomLeft.x, bottomLeft.y, bottomLeft.z]);

        let topBasicDistance: number = 0;
        let rightBasicDistance: number = 0;
        let bottomBasicDistance: number = 0;
        let leftBasicDistance: number = 0;

        if (topLeftBasic[1] < 0 && topRightBasic[1] < 0) {
            topBasicDistance = topLeftBasic[1] > topRightBasic[1] ?
                -topLeftBasic[1] :
                -topRightBasic[1];
        }

        if (topRightBasic[0] > 1 && bottomRightBasic[0] > 1) {
            rightBasicDistance = topRightBasic[0] < bottomRightBasic[0] ?
                topRightBasic[0] - 1 :
                bottomRightBasic[0] - 1;
        }

        if (bottomRightBasic[1] > 1 && bottomLeftBasic[1] > 1) {
            bottomBasicDistance = bottomRightBasic[1] < bottomLeftBasic[1] ?
                bottomRightBasic[1] - 1 :
                bottomLeftBasic[1] - 1;
        }

        if (bottomLeftBasic[0] < 0 && topLeftBasic[0] < 0) {
            leftBasicDistance = bottomLeftBasic[0] > topLeftBasic[0] ?
                -bottomLeftBasic[0] :
                -topLeftBasic[0];
        }

        return [topBasicDistance, rightBasicDistance, bottomBasicDistance, leftBasicDistance];
    }

    public getPixelDistances(
        elementWidth: number,
        elementHeight: number,
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera): number[] {

        let topLeft: THREE.Vector3 = new THREE.Vector3(-1, 1, 1).unproject(perspectiveCamera);
        let topLeftBasic: number[] = transform.projectBasic([topLeft.x, topLeft.y, topLeft.z]);

        let topRight: THREE.Vector3 = new THREE.Vector3(1, 1, 1).unproject(perspectiveCamera);
        let topRightBasic: number[] = transform.projectBasic([topRight.x, topRight.y, topRight.z]);

        let bottomRight: THREE.Vector3 = new THREE.Vector3(1, -1, 1).unproject(perspectiveCamera);
        let bottomRightBasic: number[] = transform.projectBasic([bottomRight.x, bottomRight.y, bottomRight.z]);

        let bottomLeft: THREE.Vector3 = new THREE.Vector3(-1, -1, 1).unproject(perspectiveCamera);
        let bottomLeftBasic: number[] = transform.projectBasic([bottomLeft.x, bottomLeft.y, bottomLeft.z]);

        let topPixelDistance: number = 0;
        let rightPixelDistance: number = 0;
        let bottomPixelDistance: number = 0;
        let leftPixelDistance: number = 0;

        if (topLeftBasic[1] < 0 && topRightBasic[1] < 0) {
            let basicX: number = topLeftBasic[1] > topRightBasic[1] ?
                topLeftBasic[0] :
                topRightBasic[0];

            let unprojected: number[] = transform.unprojectBasic([basicX, 0], 100);
            let canvasPoint: number[] = this.project(unprojected, elementWidth, elementHeight, perspectiveCamera);

            topPixelDistance = canvasPoint[1] > 0 ? canvasPoint[1] : 0;
        }

        if (topRightBasic[0] > 1 && bottomRightBasic[0] > 1) {
            let basicY: number = topRightBasic[0] < bottomRightBasic[0] ?
                topRightBasic[1] :
                bottomRightBasic[1];

            let unprojected: number[] = transform.unprojectBasic([1, basicY], 100);
            let canvasPoint: number[] = this.project(unprojected, elementWidth, elementHeight, perspectiveCamera);

            rightPixelDistance = canvasPoint[0] < elementWidth ? elementWidth - canvasPoint[0] : 0;
        }

        if (bottomRightBasic[1] > 1 && bottomLeftBasic[1] > 1) {
            let basicX: number = bottomRightBasic[1] < bottomLeftBasic[1] ?
                bottomRightBasic[0] :
                bottomLeftBasic[0];

            let unprojected: number[] = transform.unprojectBasic([basicX, 1], 100);
            let canvasPoint: number[] = this.project(unprojected, elementWidth, elementHeight, perspectiveCamera);

            bottomPixelDistance = canvasPoint[1] < elementHeight ? elementHeight - canvasPoint[1] : 0;
        }

        if (bottomLeftBasic[0] < 0 && topLeftBasic[0] < 0) {
            let basicY: number = bottomLeftBasic[0] > topLeftBasic[0] ?
                bottomLeftBasic[1] :
                topLeftBasic[1];

            let unprojected: number[] = transform.unprojectBasic([0, basicY], 100);
            let canvasPoint: number[] = this.project(unprojected, elementWidth, elementHeight, perspectiveCamera);

            leftPixelDistance = canvasPoint[0] > 0 ? canvasPoint[0] : 0;
        }

        return [topPixelDistance, rightPixelDistance, bottomPixelDistance, leftPixelDistance];
    }

    public project(
        point3d: number[],
        canvasWidth: number,
        canvasHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point3d[0], point3d[1], point3d[2])
                .project(perspectiveCamera);

        let viewportX: number = projected.x / projected.z;
        let viewportY: number = projected.y / projected.z;

        let canvasX: number = canvasWidth * (viewportX + 1) / 2;
        let canvasY: number = -canvasHeight * (viewportY - 1) / 2;

        return [canvasX, canvasY];
    }

    public unproject(
        canvasX: number,
        canvasY: number,
        canvasWidth: number,
        canvasHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let viewportX: number = 2 * canvasX / canvasWidth - 1;
        let viewportY: number = 1 - 2 * canvasY / canvasHeight;

        return new THREE.Vector3(viewportX, viewportY, 1)
            .unproject(perspectiveCamera);
    }
}

export default ViewportCoords;
