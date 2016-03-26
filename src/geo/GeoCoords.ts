/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

/**
 * @class GeoCoords
 *
 * @description Converts coordinates between the geodetic (WGS84),
 * Earth-Centered, Earth-Fixed (ECEF) and local topocentric
 * East, North, Up (ENU) reference frames.
 *
 * The WGS84 has latitude (degrees), longitude (degrees) and
 * altitude (meters) values.
 * The calculations uses the following WGS84 parameters:
 * a = 6378137
 * b = a * (1 - f)
 * f = 1 / 298.257223563
 *
 * The ECEF Z-axis pierces the north pole and the
 * XY-axis defines the equatorial plane. The X-axis extends
 * from the geocenter to the intersection of the Equator and
 * the Greenwich Meridian. All values in meters.
 *
 * In the ENU reference frame the x-axis points to the
 * East, the y-axis to the North and the z-axis Up. All values
 * in meters.
 */
export class GeoCoords {
    private _wgs84a: number = 6378137.0;
    private _wgs84b: number = 6356752.31424518;

    /**
     * Convert coordinates from geodetic (WGS84) reference to local topocentric
     * (ENU) reference.
     *
     * @param {number} lat Latitude in degrees.
     * @param {number} lon Longitude in degrees.
     * @param {number} alt Altitude in meters.
     * @param {number} refLat Reference latitude in degrees.
     * @param {number} refLon Reference longitude in degrees.
     * @param {number} refAlt Reference altitude in meters.
     * @returns {Array<number>} The x, y, z local topocentric ENU coordinates.
     */
    public geodeticToEnu(
        lat: number,
        lon: number,
        alt: number,
        refLat: number,
        refLon: number,
        refAlt: number): number[] {

        let ecef: number[] = this.geodeticToEcef(lat, lon, alt);

        return this.ecefToEnu(ecef[0], ecef[1], ecef[2], refLat, refLon, refAlt);
    }

    public llaToTopocentric(lat: number, lon: number, alt: number, reflat: number, reflon: number, refalt: number): number[] {
        // transform from lat, lon, alt to topocentric XYZ.

        let TM: THREE.Matrix4 = new THREE.Matrix4().getInverse(this._topocentricToEcefTransform(reflat, reflon, refalt));
        let T: Float32Array = TM.elements;
        let p: number[] = this.geodeticToEcef(lat, lon, alt);
        let x: number = p[0];
        let y: number = p[1];
        let z: number = p[2];
        let tx: number = T[0] * x + T[4] * y + T[8] * z + T[12];
        let ty: number = T[1] * x + T[5] * y + T[9] * z + T[13];
        let tz: number = T[2] * x + T[6] * y + T[10] * z + T[14];

        return [tx, ty, tz];
    }

    /**
     * Convert coordinates from local topocentric (ENU) reference to
     * geodetic (WGS84) reference.
     *
     * @param {number} x Topocentric ENU coordinate in East direction.
     * @param {number} y Topocentric ENU coordinate in North direction.
     * @param {number} z Topocentric ENU coordinate in Up direction.
     * @param {number} refLat Reference latitude in degrees.
     * @param {number} refLon Reference longitude in degrees.
     * @param {number} refAlt Reference altitude in meters.
     * @returns {Array<number>} The latitude and longitude in degrees
     *                          as well as altitude in meters.
     */
    public enuToGeodetic(
        x: number,
        y: number,
        z: number,
        refLat: number,
        refLon: number,
        refAlt: number): number[] {

        let ecef: number[] = this.enuToEcef(x, y, z, refLat, refLon, refAlt);

        return this.ecefToGeodetic(ecef[0], ecef[1], ecef[2]);
    }

    public topocentricToLla(x: number, y: number, z: number, reflat: number, reflon: number, refalt: number): number[] {
        // transform from topocentric XYZ to lat, lon, alt.

        let T: Float32Array = this._topocentricToEcefTransform(reflat, reflon, refalt).elements;
        let ex: number = T[0] * x + T[4] * y + T[8] * z + T[12];
        let ey: number = T[1] * x + T[5] * y + T[9] * z + T[13];
        let ez: number = T[2] * x + T[6] * y + T[10] * z + T[14];

        return this.ecefToGeodetic(ex, ey, ez);
    }

    /**
     * Convert coordinates from Earth-Centered, Earth-Fixed (ECEF) reference
     * to local topocentric (ENU) reference.
     *
     * @param {number} X ECEF X-value.
     * @param {number} Y ECEF Y-value.
     * @param {number} Z ECEF Z-value.
     * @param {number} refLat Reference latitude in degrees.
     * @param {number} refLon Reference longitude in degrees.
     * @param {number} refAlt Reference altitude in meters.
     * @returns {Array<number>} The x, y, z topocentric ENU coordinates in East, North
     * and Up directions respectively.
     */
    public ecefToEnu(
        X: number,
        Y: number,
        Z: number,
        refLat: number,
        refLon: number,
        refAlt: number): number[] {

        let refEcef: number[] = this.geodeticToEcef(refLat, refLon, refAlt);

        let V: number[] = [X - refEcef[0], Y - refEcef[1], Z - refEcef[2]];

        refLat = refLat * Math.PI / 180.0;
        refLon = refLon * Math.PI / 180.0;

        let cosLat: number = Math.cos(refLat);
        let sinLat: number = Math.sin(refLat);
        let cosLon: number = Math.cos(refLon);
        let sinLon: number = Math.sin(refLon);

        let x: number = -sinLon * V[0] + cosLon * V[1];
        let y: number = -sinLat * cosLon * V[0] - sinLat * sinLon * V[1] + cosLat * V[2];
        let z: number = cosLat * cosLon * V[0] + cosLat * sinLon * V[1] + sinLat * V[2];

        return [x, y, z];
    }

    /**
     * Convert coordinates from local topocentric (ENU) reference
     * to Earth-Centered, Earth-Fixed (ECEF) reference.
     *
     * @param {number} x Topocentric ENU coordinate in East direction.
     * @param {number} y Topocentric ENU coordinate in North direction.
     * @param {number} z Topocentric ENU coordinate in Up direction.
     * @param {number} refLat Reference latitude in degrees.
     * @param {number} refLon Reference longitude in degrees.
     * @param {number} refAlt Reference altitude in meters.
     * @returns {Array<number>} The X, Y, Z ECEF coordinates.
     */
    public enuToEcef(
        x: number,
        y: number,
        z: number,
        refLat: number,
        refLon: number,
        refAlt: number): number[] {

        let refEcef: number[] = this.geodeticToEcef(refLat, refLon, refAlt);

        refLat = refLat * Math.PI / 180.0;
        refLon = refLon * Math.PI / 180.0;

        let cosLat: number = Math.cos(refLat);
        let sinLat: number = Math.sin(refLat);
        let cosLon: number = Math.cos(refLon);
        let sinLon: number = Math.sin(refLon);

        let X: number = -sinLon * x - sinLat * cosLon * y + cosLat * cosLon * z + refEcef[0];
        let Y: number = cosLon * x - sinLat * sinLon * y + cosLat * sinLon * z + refEcef[1];
        let Z: number = cosLat * y + sinLat * z + refEcef[2];

        return [X, Y, Z];
    }

    /**
     * Convert coordinates from geodetic reference (WGS84) to Earth-Centered,
     * Earth-Fixed (ECEF) reference.
     *
     * @param {number} lat Latitude in degrees.
     * @param {number} lon Longitude in degrees.
     * @param {number} alt Altitude in meters.
     * @returns {Array<number>} The X, Y, Z ECEF coordinates.
     */
    public geodeticToEcef(lat: number, lon: number, alt: number): number[] {
        let a: number = this._wgs84a;
        let b: number = this._wgs84b;

        lat = lat * Math.PI / 180.0;
        lon = lon * Math.PI / 180.0;

        let cosLat: number = Math.cos(lat);
        let sinLat: number = Math.sin(lat);
        let cosLon: number = Math.cos(lon);
        let sinLon: number = Math.sin(lon);

        let a2: number = a * a;
        let b2: number = b * b;

        let L: number = 1.0 / Math.sqrt(a2 * cosLat * cosLat + b2 * sinLat * sinLat);

        let nhcl: number = (a2 * L + alt) * cosLat;

        let X: number = nhcl * cosLon;
        let Y: number = nhcl * sinLon;
        let Z: number = (b2 * L + alt) * sinLat;

        return [X, Y, Z];
    }

    /**
     * Convert coordinates from Earth-Centered, Earth-Fixed (ECEF) reference
     * to geodetic reference (WGS84).
     *
     * @param {number} X ECEF X-value.
     * @param {number} Y ECEF Y-value.
     * @param {number} Z ECEF Z-value.
     * @returns {Array<number>} The latitude and longitude in degrees
     *                          as well as altitude in meters.
     */
    public ecefToGeodetic(X: number, Y: number, Z: number): number[] {
        let a: number = this._wgs84a;
        let b: number = this._wgs84b;

        let a2: number = a * a;
        let b2: number = b * b;

        let a2mb2: number = a2 - b2;

        let ea: number = Math.sqrt(a2mb2 / a2);
        let eb: number = Math.sqrt(a2mb2 / b2);

        let p: number = Math.sqrt(X * X + Y * Y);
        let theta: number = Math.atan2(Z * a, p * b);

        let sinTheta: number = Math.sin(theta);
        let cosTheta: number = Math.cos(theta);

        let lon: number = Math.atan2(Y, X);
        let lat: number =
            Math.atan2(Z + eb * eb * b * sinTheta * sinTheta * sinTheta,
                       p - ea * ea * a * cosTheta * cosTheta * cosTheta);

        let sinLat: number = Math.sin(lat);
        let cosLat: number = Math.cos(lat);

        let N: number = a / Math.sqrt(1 - ea * ea * sinLat * sinLat);
        let alt: number = p / cosLat - N;

        return [lat * 180.0 / Math.PI, lon * 180.0 / Math.PI, alt];
    }

    private _norm(v: number[]): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    private _normalized(v: number[]): number[] {
        let n: number = this._norm(v);

        return [v[0] / n, v[1] / n, v[2] / n];
    }

    private _topocentricToEcefTransform(lat: number, lon: number, alt: number): THREE.Matrix4 {
        // transformation from a topocentric frame at reference position to ECEF.
        // the topocentric reference frame is a metric one with the origin
        // at the given (lat, lon, alt) position, with the X axis heading east,
        // the Y axis heading north and the Z axis vertical to the ellipsoid.

        let eps: number = 1e-6;
        let p: number[] = this.geodeticToEcef(lat, lon, alt);
        let px: number[] = this.geodeticToEcef(lat, lon + eps, alt);
        let mx: number[] = this.geodeticToEcef(lat, lon - eps, alt);
        let py: number[] = this.geodeticToEcef(lat + eps, lon, alt);
        let my: number[] = this.geodeticToEcef(lat - eps, lon, alt);
        let pz: number[] = this.geodeticToEcef(lat, lon, alt + eps);
        let mz: number[] = this.geodeticToEcef(lat, lon, alt - eps);
        let v1: number[] = this._normalized([ px[0] - mx[0], px[1] - mx[1], px[2] - mx[2] ]);
        let v2: number[] = this._normalized([ py[0] - my[0], py[1] - my[1], py[2] - my[2] ]);
        let v3: number[] = this._normalized([ pz[0] - mz[0], pz[1] - mz[1], pz[2] - mz[2] ]);
        let T: THREE.Matrix4 = new THREE.Matrix4();
        T.set(v1[0], v2[0], v3[0], p[0],
              v1[1], v2[1], v3[1], p[1],
              v1[2], v2[2], v3[2], p[2],
              0, 0, 0, 1);

        return T;
    }
}

export default GeoCoords;
