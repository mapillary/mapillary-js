import * as THREE from "three";

import {IGPano} from "../API";
import { CameraProjection } from "../api/interfaces/CameraProjection";

/**
 * @class Transform
 *
 * @classdesc Class used for calculating coordinate transformations
 * and projections.
 */
export class Transform {
    private _width: number;
    private _height: number;
    private _focal: number;
    private _orientation: number;
    private _scale: number;
    private _basicWidth: number;
    private _basicHeight: number;
    private _basicAspect: number;

    private _gpano: IGPano;

    private _rt: THREE.Matrix4;
    private _srt: THREE.Matrix4;

    private _basicRt: THREE.Matrix4;

    private _textureScale: number[];

    private _ck1: number;
    private _ck2: number;
    private _cameraProjection: CameraProjection;

    private _radialPeak: number;

    /**
     * Create a new transform instance.
     * @param {number} orientation - Image orientation.
     * @param {number} width - Image height.
     * @param {number} height - Image width.
     * @param {number} focal - Focal length.
     * @param {number} scale - Atomic scale.
     * @param {IGPano} gpano - Panorama properties.
     * @param {Array<number>} rotation - Rotation vector in three dimensions.
     * @param {Array<number>} translation - Translation vector in three dimensions.
     * @param {HTMLImageElement} image - Image for fallback size calculations.
     */
    constructor(
        orientation: number,
        width: number,
        height: number,
        focal: number,
        scale: number,
        gpano: IGPano,
        rotation: number[],
        translation: number[],
        image: HTMLImageElement,
        textureScale?: number[],
        ck1?: number,
        ck2?: number,
        cameraProjection?: CameraProjection) {

        this._orientation = this._getValue(orientation, 1);

        let imageWidth: number = image != null ? image.width : 4;
        let imageHeight: number = image != null ? image.height : 3;
        let keepOrientation: boolean = this._orientation < 5;

        this._width = this._getValue(width, keepOrientation ? imageWidth : imageHeight);
        this._height = this._getValue(height, keepOrientation ? imageHeight : imageWidth);

        this._basicAspect = keepOrientation ?
             this._width / this._height :
             this._height / this._width;

        this._basicWidth = keepOrientation ? width : height;
        this._basicHeight = keepOrientation ? height : width;

        this._focal = this._getValue(focal, 1);
        this._scale = this._getValue(scale, 0);

        this._gpano = gpano != null ? gpano : null;

        this._rt = this._getRt(rotation, translation);
        this._srt = this._getSrt(this._rt, this._scale);

        this._basicRt = this._getBasicRt(this._rt, orientation);

        this._textureScale = !!textureScale ? textureScale : [1, 1];

        this._ck1 = !!ck1 ? ck1 : 0;
        this._ck2 = !!ck2 ? ck2 : 0;
        this._cameraProjection = !!cameraProjection ?
            cameraProjection :
            !!gpano ?
                "equirectangular" :
                "perspective";

        this._radialPeak = this._getRadialPeak(this._ck1, this._ck2);
    }

    public get ck1(): number {
        return this._ck1;
    }

    public get ck2(): number {
        return this._ck2;
    }

    public get cameraProjection(): string {
        return this._cameraProjection;
    }

    /**
     * Get basic aspect.
     * @returns {number} The orientation adjusted aspect ratio.
     */
    public get basicAspect(): number {
        return this._basicAspect;
    }

    /**
     * Get basic height.
     *
     * @description Does not fall back to node image height but
     * uses original value from API so can be faulty.
     *
     * @returns {number} The height of the basic version image
     * (adjusted for orientation).
     */
    public get basicHeight(): number {
        return this._basicHeight;
    }

    public get basicRt(): THREE.Matrix4 {
        return this._basicRt;
    }

    /**
     * Get basic width.
     *
     * @description Does not fall back to node image width but
     * uses original value from API so can be faulty.
     *
     * @returns {number} The width of the basic version image
     * (adjusted for orientation).
     */
    public get basicWidth(): number {
        return this._basicWidth;
    }

    /**
     * Get focal.
     * @returns {number} The node focal length.
     */
    public get focal(): number {
        return this._focal;
    }

    /**
     * Get fullPano.
     *
     * @returns {boolean} Value indicating whether the node is a complete
     * 360 panorama.
     */
    public get fullPano(): boolean {
        return this._gpano != null &&
            this._gpano.CroppedAreaLeftPixels === 0 &&
            this._gpano.CroppedAreaTopPixels === 0 &&
            this._gpano.CroppedAreaImageWidthPixels === this._gpano.FullPanoWidthPixels &&
            this._gpano.CroppedAreaImageHeightPixels === this._gpano.FullPanoHeightPixels;
    }

    /**
     * Get gpano.
     * @returns {number} The node gpano information.
     */
    public get gpano(): IGPano {
        return this._gpano;
    }

    /**
     * Get height.
     *
     * @description Falls back to the node image height if
     * the API data is faulty.
     *
     * @returns {number} The orientation adjusted image height.
     */
    public get height(): number {
        return this._height;
    }

    /**
     * Get orientation.
     * @returns {number} The image orientation.
     */
    public get orientation(): number {
        return this._orientation;
    }

    /**
     * Get rt.
     * @returns {THREE.Matrix4} The extrinsic camera matrix.
     */
    public get rt(): THREE.Matrix4 {
        return this._rt;
    }

    /**
     * Get srt.
     * @returns {THREE.Matrix4} The scaled extrinsic camera matrix.
     */
    public get srt(): THREE.Matrix4 {
        return this._srt;
    }

    /**
     * Get scale.
     * @returns {number} The node atomic reconstruction scale.
     */
    public get scale(): number {
        return this._scale;
    }

    /**
     * Get has valid scale.
     * @returns {boolean} Value indicating if the scale of the transform is valid.
     */
    public get hasValidScale(): boolean {
        return this._scale > 1e-2 && this._scale < 50;
    }

    /**
     * Get radial peak.
     * @returns {number} Value indicating the radius where the radial
     * undistortion function peaks.
     */
    public get radialPeak(): number {
        return this._radialPeak;
    }

    /**
     * Get width.
     *
     * @description Falls back to the node image width if
     * the API data is faulty.
     *
     * @returns {number} The orientation adjusted image width.
     */
    public get width(): number {
        return this._width;
    }

    /**
     * Calculate the up vector for the node transform.
     *
     * @returns {THREE.Vector3} Normalized and orientation adjusted up vector.
     */
    public upVector(): THREE.Vector3 {
        let rte: number[] = this._rt.elements;

        switch (this._orientation) {
            case 1:
                return new THREE.Vector3(-rte[1], -rte[5], -rte[9]);
            case 3:
                return new THREE.Vector3(rte[1],  rte[5],  rte[9]);
            case 6:
                return new THREE.Vector3(-rte[0], -rte[4], -rte[8]);
            case 8:
                return new THREE.Vector3(rte[0],  rte[4],  rte[8]);
            default:
                return new THREE.Vector3(-rte[1], -rte[5], -rte[9]);
        }
    }

    /**
     * Calculate projector matrix for projecting 3D points to texture map
     * coordinates (u and v).
     *
     * @returns {THREE.Matrix4} Projection matrix for 3D point to texture
     * map coordinate calculations.
     */
    public projectorMatrix(): THREE.Matrix4 {
        let projector: THREE.Matrix4 = this._normalizedToTextureMatrix();

        let f: number = this._focal;
        let projection: THREE.Matrix4 = new THREE.Matrix4().set(
            f, 0, 0, 0,
            0, f, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0);

        projector.multiply(projection);
        projector.multiply(this._rt);

        return projector;
    }

    /**
     * Project 3D world coordinates to basic coordinates.
     *
     * @param {Array<number>} point3d - 3D world coordinates.
     * @return {Array<number>} 2D basic coordinates.
     */
    public projectBasic(point3d: number[]): number[] {
        let sfm: number[] = this.projectSfM(point3d);
        return this._sfmToBasic(sfm);
    }

    /**
     * Unproject basic coordinates to 3D world coordinates.
     *
     * @param {Array<number>} basic - 2D basic coordinates.
     * @param {Array<number>} distance - Distance to unproject from camera center.
     * @param {boolean} [depth] - Treat the distance value as depth from camera center.
     *                            Only applicable for perspective images. Will be
     *                            ignored for panoramas.
     * @returns {Array<number>} Unprojected 3D world coordinates.
     */
    public unprojectBasic(basic: number[], distance: number, depth?: boolean): number[] {
        let sfm: number[] = this._basicToSfm(basic);
        return this.unprojectSfM(sfm, distance, depth);
    }

    /**
     * Project 3D world coordinates to SfM coordinates.
     *
     * @param {Array<number>} point3d - 3D world coordinates.
     * @return {Array<number>} 2D SfM coordinates.
     */
    public projectSfM(point3d: number[]): number[] {
        let v: THREE.Vector4 = new THREE.Vector4(point3d[0], point3d[1], point3d[2], 1);
        v.applyMatrix4(this._rt);
        return this._bearingToSfm([v.x, v.y, v.z]);
    }

    /**
     * Unproject SfM coordinates to a 3D world coordinates.
     *
     * @param {Array<number>} sfm - 2D SfM coordinates.
     * @param {Array<number>} distance - Distance to unproject from camera center.
     * @param {boolean} [depth] - Treat the distance value as depth from camera center.
     *                            Only applicable for perspective images. Will be
     *                            ignored for panoramas.
     * @returns {Array<number>} Unprojected 3D world coordinates.
     */
    public unprojectSfM(sfm: number[], distance: number, depth?: boolean): number[] {
        let bearing: number[] = this._sfmToBearing(sfm);

        const v: THREE.Vector4 = depth && !this.gpano ?
            new THREE.Vector4(
                distance * bearing[0] / bearing[2],
                distance * bearing[1] / bearing[2],
                distance,
                1) :
            new THREE.Vector4(
                distance * bearing[0],
                distance * bearing[1],
                distance * bearing[2],
                1);

        v.applyMatrix4(new THREE.Matrix4().getInverse(this._rt));
        return [v.x / v.w, v.y / v.w, v.z / v.w];
    }

    /**
     * Transform SfM coordinates to bearing vector (3D cartesian
     * coordinates on the unit sphere).
     *
     * @param {Array<number>} sfm - 2D SfM coordinates.
     * @returns {Array<number>} Bearing vector (3D cartesian coordinates
     * on the unit sphere).
     */
    private _sfmToBearing(sfm: number[]): number[] {
        if (this._fullPano()) {
            let lon: number = sfm[0] * 2 * Math.PI;
            let lat: number = -sfm[1] * 2 * Math.PI;
            let x: number = Math.cos(lat) * Math.sin(lon);
            let y: number = -Math.sin(lat);
            let z: number = Math.cos(lat) * Math.cos(lon);
            return [x, y, z];
        } else if (this._gpano) {
            let size: number = Math.max(this.gpano.CroppedAreaImageWidthPixels, this.gpano.CroppedAreaImageHeightPixels);
            let fullPanoPixel: number[] = [
                sfm[0] * size + this.gpano.CroppedAreaImageWidthPixels / 2 + this.gpano.CroppedAreaLeftPixels,
                sfm[1] * size + this.gpano.CroppedAreaImageHeightPixels / 2 + this.gpano.CroppedAreaTopPixels,
            ];
            let lon: number = 2 * Math.PI * (fullPanoPixel[0] / this.gpano.FullPanoWidthPixels - 0.5);
            let lat: number = - Math.PI * (fullPanoPixel[1] / this.gpano.FullPanoHeightPixels - 0.5);
            let x: number = Math.cos(lat) * Math.sin(lon);
            let y: number = -Math.sin(lat);
            let z: number = Math.cos(lat) * Math.cos(lon);
            return [x, y, z];
        } else if (this._cameraProjection === "fisheye") {
            let [dxn, dyn]: number[] = [sfm[0] / this._focal, sfm[1] / this._focal];
            const dTheta: number = Math.sqrt(dxn * dxn + dyn * dyn);
            let d: number = this._distortionFromDistortedRadius(dTheta, this._ck1, this._ck2, this._radialPeak);
            let theta: number = dTheta / d;
            let z: number = Math.cos(theta);
            let r: number = Math.sin(theta);
            let x: number = r * dxn / dTheta;
            let y: number = r * dyn / dTheta;
            return [x, y, z];
        } else {
            let [dxn, dyn]: number[] = [sfm[0] / this._focal, sfm[1] / this._focal];
            const dr: number = Math.sqrt(dxn * dxn + dyn * dyn);
            let d: number = this._distortionFromDistortedRadius(dr, this._ck1, this._ck2, this._radialPeak);

            const xn: number = dxn / d;
            const yn: number = dyn / d;

            let v: THREE.Vector3 = new THREE.Vector3(xn, yn, 1);
            v.normalize();
            return [v.x, v.y, v.z];
        }
    }

    /** Compute distortion given the distorted radius.
     *
     *  Solves for d in the equation
     *    y = d(x, k1, k2) * x
     * given the distorted radius, y.
     */
    private _distortionFromDistortedRadius(distortedRadius: number, k1: number, k2: number, radialPeak: number): number {
        let d: number = 1.0;
        for (let i: number = 0; i < 10; i++) {
            let radius: number = distortedRadius / d;
            if (radius > radialPeak) {
                radius = radialPeak;
            }
            d = 1 + k1 * radius ** 2 + k2 * radius ** 4;
        }
        return d;
    }

    /**
     * Transform bearing vector (3D cartesian coordiantes on the unit sphere) to
     * SfM coordinates.
     *
     * @param {Array<number>} bearing - Bearing vector (3D cartesian coordinates on the
     * unit sphere).
     * @returns {Array<number>} 2D SfM coordinates.
     */
    private _bearingToSfm(bearing: number[]): number[] {
        if (this._fullPano()) {
            let x: number = bearing[0];
            let y: number = bearing[1];
            let z: number = bearing[2];
            let lon: number = Math.atan2(x, z);
            let lat: number = Math.atan2(-y, Math.sqrt(x * x + z * z));
            return [lon / (2 * Math.PI), -lat / (2 * Math.PI)];
        } else if (this._gpano) {
            let x: number = bearing[0];
            let y: number = bearing[1];
            let z: number = bearing[2];
            let lon: number = Math.atan2(x, z);
            let lat: number = Math.atan2(-y, Math.sqrt(x * x + z * z));
            let fullPanoPixel: number[] = [
                (lon / (2 * Math.PI) + 0.5) * this.gpano.FullPanoWidthPixels,
                (- lat / Math.PI + 0.5) * this.gpano.FullPanoHeightPixels,
            ];
            let size: number = Math.max(this.gpano.CroppedAreaImageWidthPixels, this.gpano.CroppedAreaImageHeightPixels);
            return [
                (fullPanoPixel[0] - this.gpano.CroppedAreaLeftPixels - this.gpano.CroppedAreaImageWidthPixels / 2) / size,
                (fullPanoPixel[1] - this.gpano.CroppedAreaTopPixels - this.gpano.CroppedAreaImageHeightPixels / 2) / size,
            ];
        } else if (this._cameraProjection === "fisheye") {
            if (bearing[2] > 0) {
                const [x, y, z]: number[] = bearing;
                const r: number = Math.sqrt(x * x + y * y);
                let theta: number = Math.atan2(r, z);

                if (theta > this._radialPeak) {
                    theta = this._radialPeak;
                }

                const distortion: number = 1.0 + theta ** 2 * (this._ck1 + theta ** 2 * this._ck2);
                const s: number = this._focal * distortion * theta / r;

                return [s * x, s * y];
            } else {
                return [
                    bearing[0] < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
                    bearing[1] < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
                ];
            }
        } else {
            if (bearing[2] > 0) {
                let [xn, yn]: number[] = [bearing[0] / bearing[2], bearing[1] / bearing[2]];
                let r2: number = xn * xn + yn * yn;
                const rp2: number = this._radialPeak ** 2;

                if (r2 > rp2) {
                    r2 = rp2;
                }

                const d: number = 1 + this._ck1 * r2 + this._ck2 * r2 ** 2;
                return [
                    this._focal * d * xn,
                    this._focal * d * yn,
                ];
            } else {
                return [
                    bearing[0] < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
                    bearing[1] < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
                ];
            }
        }
    }

    /**
     * Convert basic coordinates to SfM coordinates.
     *
     * @param {Array<number>} basic - 2D basic coordinates.
     * @returns {Array<number>} 2D SfM coordinates.
     */
    private _basicToSfm(basic: number[]): number[] {
        let rotatedX: number;
        let rotatedY: number;

        switch (this._orientation) {
            case 1:
                rotatedX = basic[0];
                rotatedY = basic[1];
                break;
            case 3:
                rotatedX = 1 - basic[0];
                rotatedY = 1 - basic[1];
                break;
            case 6:
                rotatedX = basic[1];
                rotatedY = 1 - basic[0];
                break;
            case 8:
                rotatedX = 1 - basic[1];
                rotatedY = basic[0];
                break;
            default:
                rotatedX = basic[0];
                rotatedY = basic[1];
                break;
        }

        let w: number = this._width;
        let h: number = this._height;
        let s: number = Math.max(w, h);
        let sfmX: number = rotatedX * w / s - w / s / 2;
        let sfmY: number = rotatedY * h / s - h / s / 2;

        return [sfmX, sfmY];
    }

    /**
     * Convert SfM coordinates to basic coordinates.
     *
     * @param {Array<number>} sfm - 2D SfM coordinates.
     * @returns {Array<number>} 2D basic coordinates.
     */
    private _sfmToBasic(sfm: number[]): number[] {
        let w: number = this._width;
        let h: number = this._height;
        let s: number = Math.max(w, h);
        let rotatedX: number = (sfm[0] + w / s / 2) / w * s;
        let rotatedY: number = (sfm[1] + h / s / 2) / h * s;

        let basicX: number;
        let basicY: number;

        switch (this._orientation) {
            case 1:
                basicX = rotatedX;
                basicY = rotatedY;
                break;
            case 3:
                basicX = 1 - rotatedX;
                basicY = 1 - rotatedY;
                break;
            case 6:
                basicX = 1 - rotatedY;
                basicY = rotatedX;
                break;
            case 8:
                basicX = rotatedY;
                basicY = 1 - rotatedX;
                break;
            default:
                basicX = rotatedX;
                basicY = rotatedY;
                break;
        }

        return [basicX, basicY];
    }

    /**
     * Determines if the gpano information indicates a full panorama.
     *
     * @returns {boolean} Value determining if the gpano information indicates
     * a full panorama.
     */
    private _fullPano(): boolean {
        return this.gpano != null &&
            this.gpano.CroppedAreaLeftPixels === 0 &&
            this.gpano.CroppedAreaTopPixels === 0 &&
            this.gpano.CroppedAreaImageWidthPixels === this.gpano.FullPanoWidthPixels &&
            this.gpano.CroppedAreaImageHeightPixels === this.gpano.FullPanoHeightPixels;
    }

    /**
     * Checks a value and returns it if it exists and is larger than 0.
     * Fallbacks if it is null.
     *
     * @param {number} value - Value to check.
     * @param {number} fallback - Value to fall back to.
     * @returns {number} The value or its fallback value if it is not defined or negative.
     */
    private _getValue(value: number, fallback: number): number {
        return value != null && value > 0 ? value : fallback;
    }

    /**
     * Creates the extrinsic camera matrix [ R | t ].
     *
     * @param {Array<number>} rotation - Rotation vector in angle axis representation.
     * @param {Array<number>} translation - Translation vector.
     * @returns {THREE.Matrix4} Extrisic camera matrix.
     */
    private _getRt(rotation: number[], translation: number[]): THREE.Matrix4 {
        let axis: THREE.Vector3 = new THREE.Vector3(rotation[0], rotation[1], rotation[2]);
        let angle: number = axis.length();
        if (angle > 0) {
            axis.normalize();
        }

        let rt: THREE.Matrix4 = new THREE.Matrix4();
        rt.makeRotationAxis(axis, angle);
        rt.setPosition(
            new THREE.Vector3(
                translation[0],
                translation[1],
                translation[2]));

        return rt;
    }

    /**
     * Calculates the scaled extrinsic camera matrix scale * [ R | t ].
     *
     * @param {THREE.Matrix4} rt - Extrisic camera matrix.
     * @param {number} scale - Scale factor.
     * @returns {THREE.Matrix4} Scaled extrisic camera matrix.
     */
    private _getSrt(rt: THREE.Matrix4, scale: number): THREE.Matrix4 {
        let srt: THREE.Matrix4 = rt.clone();
        let elements: number[] = srt.elements;

        elements[12] = scale * elements[12];
        elements[13] = scale * elements[13];
        elements[14] = scale * elements[14];

        srt.scale(new THREE.Vector3(scale, scale, scale));

        return srt;
    }

    private _getBasicRt(rt: THREE.Matrix4, orientation: number): THREE.Matrix4 {
        const axis: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
        let angle: number = 0;

        switch (orientation) {
            case 3:
                angle = Math.PI;
                break;
            case 6:
                angle = Math.PI / 2;
                break;
            case 8:
                angle = 3 * Math.PI / 2;
                break;
            default:
                break;
        }

        return new THREE.Matrix4()
            .makeRotationAxis(axis, angle)
            .multiply(rt);
    }

    private _getRadialPeak(k1: number, k2: number): number {
        const a: number = 5 * k2;
        const b: number = 3 * k1;
        const c: number = 1;
        const d: number = b ** 2 - 4 * a * c;

        if (d < 0) {
            return undefined;
        }

        const root1: number = (-b - Math.sqrt(d)) / 2 / a;
        const root2: number = (-b + Math.sqrt(d)) / 2 / a;

        const minRoot: number = Math.min(root1, root2);
        const maxRoot: number = Math.max(root1, root2);

        return minRoot > 0 ?
            Math.sqrt(minRoot) :
            maxRoot > 0 ?
                Math.sqrt(maxRoot) :
                undefined;
    }

    /**
     * Calculate a transformation matrix from normalized coordinates for
     * texture map coordinates.
     *
     * @returns {THREE.Matrix4} Normalized coordinates to texture map
     * coordinates transformation matrix.
     */
    private _normalizedToTextureMatrix(): THREE.Matrix4 {
        const size: number = Math.max(this._width, this._height);

        const scaleX: number = this._orientation < 5 ? this._textureScale[0] : this._textureScale[1];
        const scaleY: number = this._orientation < 5 ? this._textureScale[1] : this._textureScale[0];

        const w: number = size / this._width * scaleX;
        const h: number = size / this._height * scaleY;

        switch (this._orientation) {
            case 1:
                return new THREE.Matrix4().set(w, 0, 0, 0.5, 0, -h, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            case 3:
                return new THREE.Matrix4().set(-w, 0, 0, 0.5, 0, h, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            case 6:
                return new THREE.Matrix4().set(0, -h, 0, 0.5, -w, 0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            case 8:
                return new THREE.Matrix4().set(0, h, 0, 0.5, w, 0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            default:
                return new THREE.Matrix4().set(w, 0, 0, 0.5, 0, -h, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
        }
    }
}
