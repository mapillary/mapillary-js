/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Transform} from "../Geo";

/**
 * @class ViewportCoords
 */
export class ViewportCoords {
    private _unprojectDepth: number = 200;

    public basicToCanvas(
        basicX: number,
        basicY: number,
        canvasWidth: number,
        canvasHeight: number,
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let point3d: number[] = transform.unprojectBasic([basicX, basicY], this._unprojectDepth);
        let canvas: number[] = this.projectToCanvas(point3d, canvasWidth, canvasHeight, perspectiveCamera);

        return canvas;
    }

    public basicToViewport(
        basicX: number,
        basicY: number,
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let point3d: number[] = transform.unprojectBasic([basicX, basicY], this._unprojectDepth);
        let viewport: number[] = this.projectToViewport(point3d, perspectiveCamera);

        return viewport;
    }

    public canvasToBasic(
        canvasX: number,
        canvasY: number,
        canvasWidth: number,
        canvasHeight: number,
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let point3d: number[] =
            this.unprojectFromCanvas(canvasX, canvasY, canvasWidth, canvasHeight, perspectiveCamera)
            .toArray();

        let basic: number[] = transform.projectBasic(point3d);

        return basic;
    }

    public canvasToViewport(
        canvasX: number,
        canvasY: number,
        canvasWidth: number,
        canvasHeight: number):
        number[] {

        let viewportX: number = 2 * canvasX / canvasWidth - 1;
        let viewportY: number = 1 - 2 * canvasY / canvasHeight;

        return [viewportX, viewportY];
    }

    public getBasicDistances(
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let topLeftBasic: number[] = this.viewportToBasic(-1, 1, transform, perspectiveCamera);
        let topRightBasic: number[] = this.viewportToBasic(1, 1, transform, perspectiveCamera);
        let bottomRightBasic: number[] = this.viewportToBasic(1, -1, transform, perspectiveCamera);
        let bottomLeftBasic: number[] = this.viewportToBasic(-1, -1, transform, perspectiveCamera);

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
        canvasWidth: number,
        canvasHeight: number,
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let topLeftBasic: number[] = this.viewportToBasic(-1, 1, transform, perspectiveCamera);
        let topRightBasic: number[] = this.viewportToBasic(1, 1, transform, perspectiveCamera);
        let bottomRightBasic: number[] = this.viewportToBasic(1, -1, transform, perspectiveCamera);
        let bottomLeftBasic: number[] = this.viewportToBasic(-1, -1, transform, perspectiveCamera);

        let topPixelDistance: number = 0;
        let rightPixelDistance: number = 0;
        let bottomPixelDistance: number = 0;
        let leftPixelDistance: number = 0;

        if (topLeftBasic[1] < 0 && topRightBasic[1] < 0) {
            let basicX: number = topLeftBasic[1] > topRightBasic[1] ?
                topLeftBasic[0] :
                topRightBasic[0];

            let canvas: number[] = this.basicToCanvas(basicX, 0, canvasWidth, canvasHeight, transform, perspectiveCamera);

            topPixelDistance = canvas[1] > 0 ? canvas[1] : 0;
        }

        if (topRightBasic[0] > 1 && bottomRightBasic[0] > 1) {
            let basicY: number = topRightBasic[0] < bottomRightBasic[0] ?
                topRightBasic[1] :
                bottomRightBasic[1];

            let canvas: number[] = this.basicToCanvas(1, basicY, canvasWidth, canvasHeight, transform, perspectiveCamera);

            rightPixelDistance = canvas[0] < canvasWidth ? canvasWidth - canvas[0] : 0;
        }

        if (bottomRightBasic[1] > 1 && bottomLeftBasic[1] > 1) {
            let basicX: number = bottomRightBasic[1] < bottomLeftBasic[1] ?
                bottomRightBasic[0] :
                bottomLeftBasic[0];

            let canvas: number[] = this.basicToCanvas(basicX, 1, canvasWidth, canvasHeight, transform, perspectiveCamera);

            bottomPixelDistance = canvas[1] < canvasHeight ? canvasHeight - canvas[1] : 0;
        }

        if (bottomLeftBasic[0] < 0 && topLeftBasic[0] < 0) {
            let basicY: number = bottomLeftBasic[0] > topLeftBasic[0] ?
                bottomLeftBasic[1] :
                topLeftBasic[1];

            let canvas: number[] = this.basicToCanvas(0, basicY, canvasWidth, canvasHeight, transform, perspectiveCamera);

            leftPixelDistance = canvas[0] > 0 ? canvas[0] : 0;
        }

        return [topPixelDistance, rightPixelDistance, bottomPixelDistance, leftPixelDistance];
    }

    public projectToCanvas(
        point3d: number[],
        canvasWidth: number,
        canvasHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let viewport: number[] = this.projectToViewport(point3d, perspectiveCamera);
        let canvas: number[] =
            this.viewportToCanvas(viewport[0], viewport[1], canvasWidth, canvasHeight);

        return canvas;
    }

    public projectToViewport(
        point3d: number[],
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point3d[0], point3d[1], point3d[2])
                .project(perspectiveCamera);

        let viewportX: number = projected.x / projected.z;
        let viewportY: number = projected.y / projected.z;

        return [viewportX, viewportY];
    }

    public unprojectFromCanvas(
        canvasX: number,
        canvasY: number,
        canvasWidth: number,
        canvasHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let viewport: number[] =
            this.canvasToViewport(canvasX, canvasY, canvasWidth, canvasHeight);

        let point3d: THREE.Vector3 =
            this.unprojectFromViewport(viewport[0], viewport[1], perspectiveCamera);

        return point3d;
    }

    public unprojectFromViewport(
        viewportX: number,
        viewportY: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let point3d: THREE.Vector3 =
            new THREE.Vector3(viewportX, viewportY, 1)
                .unproject(perspectiveCamera);

        return point3d;
    }

    public viewportToBasic(
        viewportX: number,
        viewportY: number,
        transform: Transform,
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let point3d: number[] =
            new THREE.Vector3(viewportX, viewportY, 1)
                .unproject(perspectiveCamera)
                .toArray();

        let basic: number[] = transform.projectBasic(point3d);

        return basic;
    }

    public viewportToCanvas(
        viewportX: number,
        viewportY: number,
        canvasWidth: number,
        canvasHeight: number):
        number[] {

        let canvasX: number = canvasWidth * (viewportX + 1) / 2;
        let canvasY: number = -canvasHeight * (viewportY - 1) / 2;

        return [canvasX, canvasY];
    }
}

export default ViewportCoords;
