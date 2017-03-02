/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Transform} from "../Geo";

/**
 * @class ViewportCoords
 *
 * @classdesc Provides methods for calculating 2D coordinate conversions
 * as well as 3D projection and unprojection.
 *
 * Basic coordinates are 2D coordinates on the [0, 1] interval and
 * have the origin point, (0, 0), at the top left corner and the
 * maximum value, (1, 1), at the bottom right corner of the original
 * photo.
 *
 * Viewport coordinates are 2D coordinates on the [-1, 1] interval and
 * have the origin point in the center. The bottom left corner point is
 * (-1, -1) and the top right corner point is (1, 1).
 *
 * Canvas coordiantes are 2D pixel coordinates on the [0, canvasWidth] and
 * [0, canvasHeight] intervals. The origin point (0, 0) is in the top left
 * corner and the maximum value is (canvasWidth, canvasHeight) is in the
 * bottom right corner.
 *
 * 3D coordinates are in the topocentric world reference frame.
 */
export class ViewportCoords {
    private _unprojectDepth: number = 200;

    /**
     * Convert basic coordinates to canvas coordinates.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
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

    /**
     * Convert basic coordinates to viewport coordinates.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
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

    /**
     * Get canvas pixel position from event.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * @param {Event} event - Event containing clientX and clientY properties.
     * @param {HTMLElement} element - HTML element.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public canvasPosition(event: { clientX: number, clientY: number }, element: HTMLElement): number[] {
        let clientRect: ClientRect = element.getBoundingClientRect();

        let canvasX: number = event.clientX - clientRect.left;
        let canvasY: number = event.clientY - clientRect.top;

        return [canvasX, canvasY];
    }

    /**
     * Convert canvas coordinates to basic coordinates.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 2D basic coordinates.
     */
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

    /**
     * Convert canvas coordinates to viewport coordinates.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @returns {Array<number>} 2D viewport coordinates.
     */
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

    /**
     * Determine basic distances from image to canvas corners.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * Determines the smallest basic distance for every side of the canvas.
     *
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} Array of basic distances as [top, right, bottom, left].
     */
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

    /**
     * Determine pixel distances from image to canvas corners.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * Determines the smallest pixel distance for every side of the canvas.
     *
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} Array of pixel distances as [top, right, bottom, left].
     */
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

    /**
     * Project 3D world coordinates to canvas coordinates.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
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

    /**
     * Project 3D world coordinates to viewport coordinates.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
    public projectToViewport(
        point3d: number[],
        perspectiveCamera: THREE.PerspectiveCamera):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point3d[0], point3d[1], point3d[2])
                .project(perspectiveCamera);

        let z: number = Math.abs(projected.z) < 1e-9 ?
            projected.z < 0 ?
                -1e-9 : 1e-9 :
            projected.z;

        let viewportX: number = projected.x / z;
        let viewportY: number = projected.y / z;

        return [viewportX, viewportY];
    }

    /**
     * Uproject canvas coordinates to 3D world coordinates.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
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

    /**
     * Unproject viewport coordinates to 3D world coordinates.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
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

    /**
     * Convert viewport coordinates to basic coordinates.
     *
     * @description Transform origin and perspective camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.PerspectiveCamera} perspectiveCamera - Perspective camera used in rendering.
     * @returns {Array<number>} 2D basic coordinates.
     */
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

    /**
     * Convert viewport coordinates to canvas coordinates.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {number} canvasWidth - Width of canvas.
     * @param {number} canvasHeight - Height of canvas.
     * @returns {Array<number>} 2D canvas coordinates.
     */
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
