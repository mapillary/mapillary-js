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
 * image.
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
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public basicToCanvas(
        basicX: number,
        basicY: number,
        container: { offsetHeight: number, offsetWidth: number },
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const point3d: number[] = transform.unprojectBasic([basicX, basicY], this._unprojectDepth);
        const canvas: number[] = this.projectToCanvas(point3d, container, camera);

        return canvas;
    }

    /**
     * Convert basic coordinates to canvas coordinates safely. If 3D point is
     * behind camera null will be returned.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates if the basic point represents a 3D point
     * in front of the camera, otherwise null.
     */
    public basicToCanvasSafe(
        basicX: number,
        basicY: number,
        container: { offsetHeight: number, offsetWidth: number },
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const viewport: number[] = this.basicToViewportSafe(basicX, basicY, transform, camera);

        if (viewport === null) {
            return null;
        }

        const canvas: number[] = this.viewportToCanvas(viewport[0], viewport[1], container);

        return canvas;
    }

    /**
     * Convert basic coordinates to viewport coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    public basicToViewport(
        basicX: number,
        basicY: number,
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const point3d: number[] = transform.unprojectBasic([basicX, basicY], this._unprojectDepth);
        const viewport: number[] = this.projectToViewport(point3d, camera);

        return viewport;
    }

    /**
     * Convert basic coordinates to viewport coordinates safely. If 3D point is
     * behind camera null will be returned.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} basicX - Basic X coordinate.
     * @param {number} basicY - Basic Y coordinate.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    public basicToViewportSafe(
        basicX: number,
        basicY: number,
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const point3d: number[] = transform.unprojectBasic([basicX, basicY], this._unprojectDepth);
        const pointCamera: number[] = this.worldToCamera(point3d, camera);

        if (pointCamera[2] > 0) {
            return null;
        }

        const viewport: number[] = this.projectToViewport(point3d, camera);

        return viewport;
    }

    /**
     * Convert camera 3D coordinates to viewport coordinates.
     *
     * @param {number} pointCamera - 3D point in camera coordinate system.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    public cameraToViewport(
        pointCamera: number[],
        camera: THREE.Camera):
        number[] {

        const viewport: THREE.Vector3 =
            new THREE.Vector3().fromArray(pointCamera)
                .applyMatrix4(camera.projectionMatrix);

        return [viewport.x, viewport.y];
    }

    /**
     * Get canvas pixel position from event.
     *
     * @param {Event} event - Event containing clientX and clientY properties.
     * @param {HTMLElement} element - HTML element.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public canvasPosition(event: { clientX: number, clientY: number }, element: HTMLElement): number[] {
        const clientRect: ClientRect = element.getBoundingClientRect();

        const canvasX: number = event.clientX - clientRect.left - element.clientLeft;
        const canvasY: number = event.clientY - clientRect.top - element.clientTop;

        return [canvasX, canvasY];
    }

    /**
     * Convert canvas coordinates to basic coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D basic coordinates.
     */
    public canvasToBasic(
        canvasX: number,
        canvasY: number,
        container: { offsetHeight: number, offsetWidth: number },
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const point3d: number[] =
            this.unprojectFromCanvas(canvasX, canvasY, container, camera)
                .toArray();

        const basic: number[] = transform.projectBasic(point3d);

        return basic;
    }

    /**
     * Convert canvas coordinates to viewport coordinates.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    public canvasToViewport(
        canvasX: number,
        canvasY: number,
        container: { offsetHeight: number, offsetWidth: number }):
        number[] {

        const [canvasWidth, canvasHeight]: number[] = this.containerToCanvas(container);
        const viewportX: number = 2 * canvasX / canvasWidth - 1;
        const viewportY: number = 1 - 2 * canvasY / canvasHeight;

        return [viewportX, viewportY];
    }

    /**
     * Determines the width and height of the container in canvas coordinates.
     *
     * @param {HTMLElement} container - The viewer container.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public containerToCanvas(container: { offsetHeight: number, offsetWidth: number }): number[] {
        return [container.offsetWidth, container.offsetHeight];
    }

    /**
     * Determine basic distances from image to canvas corners.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * Determines the smallest basic distance for every side of the canvas.
     *
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} Array of basic distances as [top, right, bottom, left].
     */
    public getBasicDistances(
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const topLeftBasic: number[] = this.viewportToBasic(-1, 1, transform, camera);
        const topRightBasic: number[] = this.viewportToBasic(1, 1, transform, camera);
        const bottomRightBasic: number[] = this.viewportToBasic(1, -1, transform, camera);
        const bottomLeftBasic: number[] = this.viewportToBasic(-1, -1, transform, camera);

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
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * Determines the smallest pixel distance for every side of the canvas.
     *
     * @param {HTMLElement} container - The viewer container.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} Array of pixel distances as [top, right, bottom, left].
     */
    public getPixelDistances(
        container: { offsetHeight: number, offsetWidth: number },
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const topLeftBasic: number[] = this.viewportToBasic(-1, 1, transform, camera);
        const topRightBasic: number[] = this.viewportToBasic(1, 1, transform, camera);
        const bottomRightBasic: number[] = this.viewportToBasic(1, -1, transform, camera);
        const bottomLeftBasic: number[] = this.viewportToBasic(-1, -1, transform, camera);

        let topPixelDistance: number = 0;
        let rightPixelDistance: number = 0;
        let bottomPixelDistance: number = 0;
        let leftPixelDistance: number = 0;

        const [canvasWidth, canvasHeight]: number[] = this.containerToCanvas(container);

        if (topLeftBasic[1] < 0 && topRightBasic[1] < 0) {
            const basicX: number = topLeftBasic[1] > topRightBasic[1] ?
                topLeftBasic[0] :
                topRightBasic[0];

            const canvas: number[] = this.basicToCanvas(basicX, 0, container, transform, camera);

            topPixelDistance = canvas[1] > 0 ? canvas[1] : 0;
        }

        if (topRightBasic[0] > 1 && bottomRightBasic[0] > 1) {
            const basicY: number = topRightBasic[0] < bottomRightBasic[0] ?
                topRightBasic[1] :
                bottomRightBasic[1];

            const canvas: number[] = this.basicToCanvas(1, basicY, container, transform, camera);

            rightPixelDistance = canvas[0] < canvasWidth ? canvasWidth - canvas[0] : 0;
        }

        if (bottomRightBasic[1] > 1 && bottomLeftBasic[1] > 1) {
            const basicX: number = bottomRightBasic[1] < bottomLeftBasic[1] ?
                bottomRightBasic[0] :
                bottomLeftBasic[0];

            const canvas: number[] = this.basicToCanvas(basicX, 1, container, transform, camera);

            bottomPixelDistance = canvas[1] < canvasHeight ? canvasHeight - canvas[1] : 0;
        }

        if (bottomLeftBasic[0] < 0 && topLeftBasic[0] < 0) {
            const basicY: number = bottomLeftBasic[0] > topLeftBasic[0] ?
                bottomLeftBasic[1] :
                topLeftBasic[1];

            const canvas: number[] = this.basicToCanvas(0, basicY, container, transform, camera);

            leftPixelDistance = canvas[0] > 0 ? canvas[0] : 0;
        }

        return [topPixelDistance, rightPixelDistance, bottomPixelDistance, leftPixelDistance];
    }

    /**
     * Determine if an event occured inside an element.
     *
     * @param {Event} event - Event containing clientX and clientY properties.
     * @param {HTMLElement} element - HTML element.
     * @returns {boolean} Value indicating if the event occured inside the element or not.
     */
    public insideElement(event: { clientX: number, clientY: number }, element: HTMLElement): boolean {
        const clientRect: ClientRect = element.getBoundingClientRect();

        const minX: number = clientRect.left + element.clientLeft;
        const maxX: number = minX + element.clientWidth;
        const minY: number = clientRect.top + element.clientTop;
        const maxY: number = minY + element.clientHeight;

        return event.clientX > minX &&
            event.clientX < maxX &&
            event.clientY > minY &&
            event.clientY < maxY;
    }

    /**
     * Project 3D world coordinates to canvas coordinates.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {HTMLElement} container - The viewer container.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public projectToCanvas(
        point3d: number[],
        container: { offsetHeight: number, offsetWidth: number },
        camera: THREE.Camera):
        number[] {

        const viewport: number[] = this.projectToViewport(point3d, camera);
        const canvas: number[] =
            this.viewportToCanvas(viewport[0], viewport[1], container);

        return canvas;
    }

    /**
     * Project 3D world coordinates to canvas coordinates safely. If 3D
     * point is behind camera null will be returned.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {HTMLElement} container - The viewer container.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public projectToCanvasSafe(
        point3d: number[],
        container: { offsetHeight: number, offsetWidth: number },
        camera: THREE.Camera):
        number[] {

        const pointCamera: number[] = this.worldToCamera(point3d, camera);

        if (pointCamera[2] > 0) {
            return null;
        }

        const viewport: number[] = this.projectToViewport(point3d, camera);
        const canvas: number[] =
            this.viewportToCanvas(viewport[0], viewport[1], container);

        return canvas;
    }

    /**
     * Project 3D world coordinates to viewport coordinates.
     *
     * @param {Array<number>} point3D - 3D world coordinates.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D viewport coordinates.
     */
    public projectToViewport(
        point3d: number[],
        camera: THREE.Camera):
        number[] {

        const viewport: THREE.Vector3 =
            new THREE.Vector3(point3d[0], point3d[1], point3d[2])
                .project(camera);

        return [viewport.x, viewport.y];
    }

    /**
     * Uproject canvas coordinates to 3D world coordinates.
     *
     * @param {number} canvasX - Canvas X coordinate.
     * @param {number} canvasY - Canvas Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
    public unprojectFromCanvas(
        canvasX: number,
        canvasY: number,
        container: { offsetHeight: number, offsetWidth: number },
        camera: THREE.Camera):
        THREE.Vector3 {

        const viewport: number[] =
            this.canvasToViewport(canvasX, canvasY, container);

        const point3d: THREE.Vector3 =
            this.unprojectFromViewport(viewport[0], viewport[1], camera);

        return point3d;
    }

    /**
     * Unproject viewport coordinates to 3D world coordinates.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 3D world coordinates.
     */
    public unprojectFromViewport(
        viewportX: number,
        viewportY: number,
        camera: THREE.Camera):
        THREE.Vector3 {

        const point3d: THREE.Vector3 =
            new THREE.Vector3(viewportX, viewportY, 1)
                .unproject(camera);

        return point3d;
    }

    /**
     * Convert viewport coordinates to basic coordinates.
     *
     * @description Transform origin and camera position needs to be the
     * equal for reliable return value.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {Transform} transform - Transform of the node to unproject from.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 2D basic coordinates.
     */
    public viewportToBasic(
        viewportX: number,
        viewportY: number,
        transform: Transform,
        camera: THREE.Camera):
        number[] {

        const point3d: number[] =
            new THREE.Vector3(viewportX, viewportY, 1)
                .unproject(camera)
                .toArray();

        const basic: number[] = transform.projectBasic(point3d);

        return basic;
    }

    /**
     * Convert viewport coordinates to canvas coordinates.
     *
     * @param {number} viewportX - Viewport X coordinate.
     * @param {number} viewportY - Viewport Y coordinate.
     * @param {HTMLElement} container - The viewer container.
     * @returns {Array<number>} 2D canvas coordinates.
     */
    public viewportToCanvas(
        viewportX: number,
        viewportY: number,
        container: { offsetHeight: number, offsetWidth: number }):
        number[] {

        const [canvasWidth, canvasHeight]: number[] = this.containerToCanvas(container);
        const canvasX: number = canvasWidth * (viewportX + 1) / 2;
        const canvasY: number = -canvasHeight * (viewportY - 1) / 2;

        return [canvasX, canvasY];
    }

    /**
     * Convert 3D world coordinates to 3D camera coordinates.
     *
     * @param {number} point3D - 3D point in world coordinate system.
     * @param {THREE.Camera} camera - Camera used in rendering.
     * @returns {Array<number>} 3D camera coordinates.
     */
    public worldToCamera(
        point3d: number[],
        camera: THREE.Camera): number[] {

        const pointCamera: THREE.Vector3 =
            new THREE.Vector3(point3d[0], point3d[1], point3d[2])
                .applyMatrix4(camera.matrixWorldInverse);

        return pointCamera.toArray();
    }
}

export default ViewportCoords;
