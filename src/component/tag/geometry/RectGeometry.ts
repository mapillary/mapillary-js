import {GeometryTagError, VertexGeometry} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class RectGeometry
 *
 * @classdesc Represents a rectangle geometry in the 2D basic image coordinate system.
 *
 * @example
 * ```
 * var basicRect = [0.5, 0.3, 0.7, 0.4];
 * var rectGeometry = new Mapillary.TagComponent.RectGeometry(basicRect);
 * ```
 */
export class RectGeometry extends VertexGeometry {
    private _anchorIndex: number;
    private _inverted: boolean;
    private _rect: number[];

    /**
     * Create a rectangle geometry.
     *
     * @constructor
     * @param {Array<number>} rect - An array representing the top-left and bottom-right
     * corners of the rectangle in basic coordinates. Ordered according to [x0, y0, x1, y1].
     *
     * @throws {GeometryTagError} Rectangle coordinates must be valid basic coordinates.
     */
    constructor(rect: number[]) {
        super();

        if (rect[1] > rect[3]) {
            throw new GeometryTagError("Basic Y coordinates values can not be inverted.");
        }

        for (let coord of rect) {
            if (coord < 0 || coord > 1) {
                throw new GeometryTagError("Basic coordinates must be on the interval [0, 1].");
            }
        }

        this._anchorIndex = undefined;
        this._rect = rect.slice(0, 4);
        this._inverted = this._rect[0] > this._rect[2];
    }

    /**
     * Get anchor index property.
     *
     * @returns {number} Index representing the current anchor property if
     * achoring indexing has been initialized. If anchor indexing has not been
     * initialized or has been terminated undefined will be returned.
     * @ignore
     */
    public get anchorIndex(): number {
        return this._anchorIndex;
    }

    /**
     * Get inverted property.
     *
     * @returns {boolean} Boolean determining whether the rect geometry is
     * inverted. For panoramas the rect geometrye may be inverted.
     * @ignore
     */
    public get inverted(): boolean {
        return this._inverted;
    }

    /**
     * Get rect property.
     *
     * @returns {Array<number>} Array representing the top-left and bottom-right
     * corners of the rectangle in basic coordinates.
     */
    public get rect(): number[] {
        return this._rect;
    }

    /**
     * Initialize anchor indexing to enable setting opposite vertex.
     *
     * @param {number} [index] - The index of the vertex to use as anchor.
     *
     * @throws {Error} If anchor indexing has already been initialized.
     * @throws {Error} If index is not valid (0 to 3).
     * @ignore
     */
    public initializeAnchorIndexing(index?: number): void {
        if (this._anchorIndex !== undefined) {
            throw new Error("Anchor indexing is already initialized.");
        }

        if (index < 0 || index > 3) {
            throw new Error(`Invalid anchor index: ${index}.`);
        }

        this._anchorIndex = index === undefined ? 0 : index;
    }

    /**
     * Terminate anchor indexing to disable setting pposite vertex.
     * @ignore
     */
    public terminateAnchorIndexing(): void {
        this._anchorIndex = undefined;
    }

    /**
     * Set the value of the vertex opposite to the anchor in the polygon
     * representation of the rectangle.
     *
     * @description Setting the opposite vertex may change the anchor index.
     *
     * @param {Array<number>} opposite - The new value of the vertex opposite to the anchor.
     * @param {Transform} transform - The transform of the node related to the rectangle.
     *
     * @throws {Error} When anchor indexing has not been initialized.
     * @ignore
     */
    public setOppositeVertex2d(opposite: number[], transform: Transform): void {
        if (this._anchorIndex === undefined) {
            throw new Error("Anchor indexing needs to be initialized.");
        }

        const changed: number[] = [
            Math.max(0, Math.min(1, opposite[0])),
            Math.max(0, Math.min(1, opposite[1])),
        ];

        const original: number[] = this._rect.slice();
        const anchor: number[] = this._anchorIndex === 0 ? [original[0], original[3]] :
            this._anchorIndex === 1 ? [original[0], original[1]] :
            this._anchorIndex === 2 ? [original[2], original[1]] :
            [original[2], original[3]];

        if (transform.fullPano) {
            const deltaX: number = this._anchorIndex < 2 ?
                changed[0] - original[2] :
                changed[0] - original[0];

            if (!this._inverted && this._anchorIndex < 2 && changed[0] < 0.25 && original[2] > 0.75 && deltaX < -0.5) {
                // right side passes boundary rightward
                this._inverted = true;
                this._anchorIndex = anchor[1] > changed[1] ? 0 : 1;
            } else if (!this._inverted && this._anchorIndex >= 2 && changed[0] < 0.25 && original[2] > 0.75 && deltaX < -0.5) {
                // left side passes right side and boundary rightward
                this._inverted = true;
                this._anchorIndex = anchor[1] > changed[1] ? 0 : 1;
            } else if (this._inverted && this._anchorIndex >= 2 && changed[0] < 0.25 && original[0] > 0.75 && deltaX < -0.5) {
                this._inverted = false;
                if (anchor[0] > changed[0]) {
                    // left side passes boundary rightward
                    this._anchorIndex = anchor[1] > changed[1] ? 3 : 2;
                } else {
                    // left side passes right side and boundary rightward
                    this._anchorIndex = anchor[1] > changed[1] ? 0 : 1;
                }
            } else if (!this._inverted && this._anchorIndex >= 2 && changed[0] > 0.75 && original[0] < 0.25 && deltaX > 0.5) {
                // left side passes boundary leftward
                this._inverted = true;
                this._anchorIndex = anchor[1] > changed[1] ? 3 : 2;
            } else if (!this._inverted && this._anchorIndex < 2 && changed[0] > 0.75 && original[0] < 0.25 && deltaX > 0.5) {
                // right side passes left side and boundary leftward
                this._inverted = true;
                this._anchorIndex = anchor[1] > changed[1] ? 3 : 2;
            } else if (this._inverted && this._anchorIndex < 2 && changed[0] > 0.75 && original[2] < 0.25 && deltaX > 0.5) {
                this._inverted = false;
                if (anchor[0] > changed[0]) {
                    // right side passes boundary leftward
                    this._anchorIndex = anchor[1] > changed[1] ? 3 : 2;
                } else {
                    // right side passes left side and boundary leftward
                    this._anchorIndex = anchor[1] > changed[1] ? 0 : 1;
                }
            } else if (this._inverted && this._anchorIndex < 2 && changed[0] > original[0]) {
                // inverted and right side passes left side completing a loop
                this._inverted = false;
                this._anchorIndex = anchor[1] > changed[1] ? 0 : 1;
            } else if (this._inverted && this._anchorIndex >= 2 && changed[0] < original[2]) {
                // inverted and left side passes right side completing a loop
                this._inverted = false;
                this._anchorIndex = anchor[1] > changed[1] ? 3 : 2;
            } else if (this._inverted) {
                // if still inverted only top and bottom can switch
                if (this._anchorIndex < 2) {
                    this._anchorIndex = anchor[1] > changed[1] ? 0 : 1;
                } else {
                    this._anchorIndex = anchor[1] > changed[1] ? 3 : 2;
                }
            } else {
                // if still not inverted treat as non full pano
                if (anchor[0] <= changed[0] && anchor[1] > changed[1]) {
                    this._anchorIndex = 0;
                } else if (anchor[0] <= changed[0] && anchor[1] <= changed[1]) {
                    this._anchorIndex = 1;
                } else if (anchor[0] > changed[0] && anchor[1] <= changed[1]) {
                    this._anchorIndex = 2;
                } else {
                    this._anchorIndex = 3;
                }
            }

            const rect: number[] = [];
            if (this._anchorIndex === 0) {
                rect[0] = anchor[0];
                rect[1] = changed[1];
                rect[2] = changed[0];
                rect[3] = anchor[1];
            } else if (this._anchorIndex === 1) {
                rect[0] = anchor[0];
                rect[1] = anchor[1];
                rect[2] = changed[0];
                rect[3] = changed[1];
            } else if (this._anchorIndex === 2) {
                rect[0] = changed[0];
                rect[1] = anchor[1];
                rect[2] = anchor[0];
                rect[3] = changed[1];
            } else {
                rect[0] = changed[0];
                rect[1] = changed[1];
                rect[2] = anchor[0];
                rect[3] = anchor[1];
            }

            if (!this._inverted && rect[0] > rect[2] ||
                this._inverted && rect[0] < rect[2]) {
                rect[0] = original[0];
                rect[2] = original[2];
            }

            if (rect[1] > rect[3]) {
                rect[1] = original[1];
                rect[3] = original[3];
            }

            this._rect[0] = rect[0];
            this._rect[1] = rect[1];
            this._rect[2] = rect[2];
            this._rect[3] = rect[3];
        } else {
            if (anchor[0] <= changed[0] && anchor[1] > changed[1]) {
                this._anchorIndex = 0;
            } else if (anchor[0] <= changed[0] && anchor[1] <= changed[1]) {
                this._anchorIndex = 1;
            } else if (anchor[0] > changed[0] && anchor[1] <= changed[1]) {
                this._anchorIndex = 2;
            } else {
                this._anchorIndex = 3;
            }

            const rect: number[] = [];
            if (this._anchorIndex === 0) {
                rect[0] = anchor[0];
                rect[1] = changed[1];
                rect[2] = changed[0];
                rect[3] = anchor[1];
            } else if (this._anchorIndex === 1) {
                rect[0] = anchor[0];
                rect[1] = anchor[1];
                rect[2] = changed[0];
                rect[3] = changed[1];
            } else if (this._anchorIndex === 2) {
                rect[0] = changed[0];
                rect[1] = anchor[1];
                rect[2] = anchor[0];
                rect[3] = changed[1];
            } else {
                rect[0] = changed[0];
                rect[1] = changed[1];
                rect[2] = anchor[0];
                rect[3] = anchor[1];
            }

            if (rect[0] > rect[2]) {
                rect[0] = original[0];
                rect[2] = original[2];
            }

            if (rect[1] > rect[3]) {
                rect[1] = original[1];
                rect[3] = original[3];
            }

            this._rect[0] = rect[0];
            this._rect[1] = rect[1];
            this._rect[2] = rect[2];
            this._rect[3] = rect[3];
        }

        this._notifyChanged$.next(this);
    }

    /**
     * Set the value of a vertex in the polygon representation of the rectangle.
     *
     * @description The polygon is defined to have the first vertex at the
     * bottom-left corner with the rest of the vertices following in clockwise order.
     *
     * @param {number} index - The index of the vertex to be set.
     * @param {Array<number>} value - The new value of the vertex.
     * @param {Transform} transform - The transform of the node related to the rectangle.
     * @ignore
     */
    public setVertex2d(index: number, value: number[], transform: Transform): void {
        let original: number[] = this._rect.slice();

        let changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        let rect: number[] = [];
        if (index === 0) {
            rect[0] = changed[0];
            rect[1] = original[1];
            rect[2] = original[2];
            rect[3] = changed[1];
        } else if (index === 1) {
            rect[0] = changed[0];
            rect[1] = changed[1];
            rect[2] = original[2];
            rect[3] = original[3];
        } else if (index === 2) {
            rect[0] = original[0];
            rect[1] = changed[1];
            rect[2] = changed[0];
            rect[3] = original[3];
        } else if (index === 3) {
            rect[0] = original[0];
            rect[1] = original[1];
            rect[2] = changed[0];
            rect[3] = changed[1];
        }

        if (transform.fullPano) {
            let passingBoundaryLeftward: boolean =
                index < 2 && changed[0] > 0.75 && original[0] < 0.25 ||
                index >= 2 && this._inverted && changed[0] > 0.75 && original[2] < 0.25;

            let passingBoundaryRightward: boolean =
                index < 2 && this._inverted && changed[0] < 0.25 && original[0] > 0.75 ||
                index >= 2 && changed[0] < 0.25 && original[2] > 0.75;

            if (passingBoundaryLeftward || passingBoundaryRightward) {
                this._inverted = !this._inverted;
            } else {
                if (rect[0] - original[0] < -0.25) {
                    rect[0] = original[0];
                }

                if (rect[2] - original[2] > 0.25) {
                    rect[2] = original[2];
                }
            }

            if (!this._inverted && rect[0] > rect[2] ||
                this._inverted && rect[0] < rect[2]) {
                rect[0] = original[0];
                rect[2] = original[2];
            }
        } else {
            if (rect[0] > rect[2]) {
                rect[0] = original[0];
                rect[2] = original[2];
            }
        }

        if (rect[1] > rect[3]) {
            rect[1] = original[1];
            rect[3] = original[3];
        }

        this._rect[0] = rect[0];
        this._rect[1] = rect[1];
        this._rect[2] = rect[2];
        this._rect[3] = rect[3];

        this._notifyChanged$.next(this);
    }

    /** @ignore */
    public setCentroid2d(value: number[], transform: Transform): void {
        let original: number[] = this._rect.slice();

        let x0: number = original[0];
        let x1: number = this._inverted ? original[2] + 1 : original[2];

        let y0: number = original[1];
        let y1: number = original[3];

        let centerX: number = x0 + (x1 - x0) / 2;
        let centerY: number = y0 + (y1 - y0) / 2;

        let translationX: number = 0;

        if (transform.gpano != null &&
            transform.gpano.CroppedAreaImageWidthPixels === transform.gpano.FullPanoWidthPixels) {
            translationX = this._inverted ? value[0] + 1 - centerX : value[0] - centerX;
        } else {
            let minTranslationX: number = -x0;
            let maxTranslationX: number = 1 - x1;

            translationX = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centerX));
        }

        let minTranslationY: number = -y0;
        let maxTranslationY: number = 1 - y1;

        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centerY));

        this._rect[0] = original[0] + translationX;
        this._rect[1] = original[1] + translationY;
        this._rect[2] = original[2] + translationX;
        this._rect[3] = original[3] + translationY;

        if (this._rect[0] < 0) {
            this._rect[0] += 1;
            this._inverted = !this._inverted;
        } else if (this._rect[0] > 1) {
            this._rect[0] -= 1;
            this._inverted = !this._inverted;
        }

        if (this._rect[2] < 0) {
            this._rect[2] += 1;
            this._inverted = !this._inverted;
        } else if (this._rect[2] > 1) {
            this._rect[2] -= 1;
            this._inverted = !this._inverted;
        }

        this._notifyChanged$.next(this);
    }

    /**
     * Get the 3D coordinates for the vertices of the rectangle with
     * interpolated points along the lines.
     *
     * @param {Transform} transform - The transform of the node related to
     * the rectangle.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates
     * representing the rectangle.
     * @ignore
     */
    public getPoints3d(transform: Transform): number[][] {
        return this._getPoints2d()
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order. The method shifts the right side
     * coordinates of the rectangle by one unit to ensure that the vertices are ordered
     * clockwise.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    public getVertex2d(index: number): number[] {
        return this._rectToVertices2d(this._rect)[index];
    }

    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order. The coordinates will not be shifted
     * so they may not appear in clockwise order when layed out on the plane.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    public getNonAdjustedVertex2d(index: number): number[] {
        return this._rectToNonAdjustedVertices2d(this._rect)[index];
    }

    /**
     * Get a vertex from the polygon representation of the 3D coordinates for the
     * vertices of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @param {number} index - Vertex index.
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the vertices of the geometry.
     * @ignore
     */
    public getVertex3d(index: number, transform: Transform): number[] {
        return transform.unprojectBasic(this._rectToVertices2d(this._rect)[index], 200);
    }

    /**
     * Get a polygon representation of the 2D basic coordinates for the vertices of the rectangle.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @returns {Array<Array<number>>} Polygon array of 2D basic coordinates representing
     * the rectangle vertices.
     * @ignore
     */
    public getVertices2d(): number[][] {
        return this._rectToVertices2d(this._rect);
    }

    /**
     * Get a polygon representation of the 3D coordinates for the vertices of the rectangle.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @param {Transform} transform - The transform of the node related to the rectangle.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the rectangle vertices.
     * @ignore
     */
    public getVertices3d(transform: Transform): number[][] {
        return this._rectToVertices2d(this._rect)
            .map(
                (vertex: number[]) => {
                    return transform.unprojectBasic(vertex, 200);
                });
    }

    /** @ignore */
    public getCentroid2d(): number[] {
        const rect: number[] = this._rect;

        const x0: number = rect[0];
        const x1: number = this._inverted ? rect[2] + 1 : rect[2];

        const y0: number = rect[1];
        const y1: number = rect[3];

        const centroidX: number = (x0 + x1) / 2;
        const centroidY: number = (y0 + y1) / 2;

        return [centroidX, centroidY];
    }

    /** @ignore */
    public getCentroid3d(transform: Transform): number[] {
        const centroid2d: number[] = this.getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    /**
     * @ignore
     */
    public getPoleOfInaccessibility2d(): number[] {
        return this._getPoleOfInaccessibility2d(this._rectToVertices2d(this._rect));
    }

    /** @ignore */
    public getPoleOfInaccessibility3d(transform: Transform): number[] {
        let pole2d: number[] = this._getPoleOfInaccessibility2d(this._rectToVertices2d(this._rect));

        return transform.unprojectBasic(pole2d, 200);
    }

    /** @ignore */
    public getTriangles3d(transform: Transform): number[] {
        return transform.fullPano ?
            [] :
            this._triangulate(
                this._project(this._getPoints2d(), transform),
                this.getPoints3d(transform));
    }

    /**
     * Check if a particular bottom-right value is valid according to the current
     * rectangle coordinates.
     *
     * @param {Array<number>} bottomRight - The bottom-right coordinates to validate
     * @returns {boolean} Value indicating whether the provided bottom-right coordinates
     * are valid.
     * @ignore
     */
    public validate(bottomRight: number[]): boolean {
        let rect: number[] = this._rect;

        if (!this._inverted && bottomRight[0] < rect[0] ||
            bottomRight[0] - rect[2] > 0.25 ||
            bottomRight[1] < rect[1]) {
            return false;
        }

        return true;
    }

    /**
     * Get the 2D coordinates for the vertices of the rectangle with
     * interpolated points along the lines.
     *
     * @returns {Array<Array<number>>} Polygon array of 2D basic coordinates
     * representing the rectangle.
     */
    private _getPoints2d(): number[][] {
        let vertices2d: number[][] = this._rectToVertices2d(this._rect);

        let sides: number = vertices2d.length - 1;
        let sections: number = 10;

        let points2d: number[][] = [];

        for (let i: number = 0; i < sides; ++i) {
            let startX: number = vertices2d[i][0];
            let startY: number = vertices2d[i][1];

            let endX: number = vertices2d[i + 1][0];
            let endY: number = vertices2d[i + 1][1];

            let intervalX: number = (endX - startX) / (sections - 1);
            let intervalY: number = (endY - startY) / (sections - 1);

            for (let j: number = 0; j < sections; ++j) {
                let point: number[] = [
                    startX + j * intervalX,
                    startY + j * intervalY,
                ];

                points2d.push(point);
            }
        }

        return points2d;
    }

    /**
     * Convert the top-left, bottom-right representation of a rectangle to a polygon
     * representation of the vertices starting at the bottom-left corner going
     * clockwise.
     *
     * @description The method shifts the right side coordinates of the rectangle
     * by one unit to ensure that the vertices are ordered clockwise.
     *
     * @param {Array<number>} rect - Top-left, bottom-right representation of a
     * rectangle.
     * @returns {Array<Array<number>>} Polygon representation of the vertices of the
     * rectangle.
     */
    private _rectToVertices2d(rect: number[]): number[][] {
        return [
            [rect[0], rect[3]],
            [rect[0], rect[1]],
            [this._inverted ? rect[2] + 1 : rect[2], rect[1]],
            [this._inverted ? rect[2] + 1 : rect[2], rect[3]],
            [rect[0], rect[3]],
        ];
    }

    /**
     * Convert the top-left, bottom-right representation of a rectangle to a polygon
     * representation of the vertices starting at the bottom-left corner going
     * clockwise.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order. The coordinates will not be shifted
     * to ensure that the vertices are ordered clockwise when layed out on the plane.
     *
     * @param {Array<number>} rect - Top-left, bottom-right representation of a
     * rectangle.
     * @returns {Array<Array<number>>} Polygon representation of the vertices of the
     * rectangle.
     */
    private _rectToNonAdjustedVertices2d(rect: number[]): number[][] {
        return [
            [rect[0], rect[3]],
            [rect[0], rect[1]],
            [rect[2], rect[1]],
            [rect[2], rect[3]],
            [rect[0], rect[3]],
        ];
    }
}

export default RectGeometry;
