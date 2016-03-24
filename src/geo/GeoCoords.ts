/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

export class GeoCoords {
    // this is a translation of OpenSfM's geo.py

    private _wgs84a: number = 6378137.0;
    private _wgs84b: number = 6356752.31424518;

    public llaToTopocentric(lat: number, lon: number, alt: number, reflat: number, reflon: number, refalt: number): number[] {
        // transform from lat, lon, alt to topocentric XYZ.

        let TM: THREE.Matrix4 = new THREE.Matrix4().getInverse(this._topocentricToEcefTransform(reflat, reflon, refalt));
        let T: Float32Array = TM.elements;
        let p: number[] = this.llaToEcef(lat, lon, alt);
        let x: number = p[0];
        let y: number = p[1];
        let z: number = p[2];
        let tx: number = T[0] * x + T[4] * y + T[8] * z + T[12];
        let ty: number = T[1] * x + T[5] * y + T[9] * z + T[13];
        let tz: number = T[2] * x + T[6] * y + T[10] * z + T[14];

        return [tx, ty, tz];
    }

    public topocentricToLla(x: number, y: number, z: number, reflat: number, reflon: number, refalt: number): number[] {
        // transform from topocentric XYZ to lat, lon, alt.

        let T: Float32Array = this._topocentricToEcefTransform(reflat, reflon, refalt).elements;
        let ex: number = T[0] * x + T[4] * y + T[8] * z + T[12];
        let ey: number = T[1] * x + T[5] * y + T[9] * z + T[13];
        let ez: number = T[2] * x + T[6] * y + T[10] * z + T[14];

        return this._ecefToLla(ex, ey, ez);
    }

    /**
     * Convert coordinates from geodetic reference (WGS84) to Earth-Centered,
     * Earth-Fixed (ECEF) reference.
     *
     * @description Uses the following WGS84 parameters:
     *              a = 6378137
     *              b = a * (1 - f)
     *              f = 1 / 298.257223563
     *
     *              The ECEF Z-axis pierces the north pole and the
     *              XY-axis defines the equatorial plane. The X-axis extends
     *              from the geocenter to the intersection of the Equator and
     *              the Greenwich Meridian.
     *
     * @param {number} lat Latitude in degrees.
     * @param {number} lon Longitude in degrees.
     * @param {number} alt Altitude in meters.
     * @returns {Array<number>} The X, Y, Z ECEF coordinates.
     */
    public llaToEcef(lat: number, lon: number, alt: number): number[] {
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

        let x: number = nhcl * cosLon;
        let y: number = nhcl * sinLon;
        let z: number = (b2 * L + alt) * sinLat;

        return [x, y, z];
    }

    private _ecefToLla(x: number, y: number, z: number): number[] {
        // compute latitude, longitude and altitude from ECEF XYZ.
        // all using the WGS94 model.
        // altitude is the distance to the WGS94 ellipsoid.

        let a: number = this._wgs84a;
        let b: number = this._wgs84b;
        let ea: number = Math.sqrt((a * a - b * b) / (a * a));
        let eb: number = Math.sqrt((a * a - b * b) / (b * b));
        let p: number = Math.sqrt(x * x + y * y);
        let theta: number = Math.atan2(z * a, p * b);
        let sintheta: number = Math.sin(theta);
        let costheta: number = Math.cos(theta);
        let lon: number = Math.atan2(y, x);
        let lat: number =
            Math.atan2(z + eb * eb * b * sintheta * sintheta * sintheta,
                       p - ea * ea * a * costheta * costheta * costheta);
        let sinlat: number = Math.sin(lat);
        let coslat: number = Math.cos(lat);
        let N: number = a / Math.sqrt(1 - ea * ea * sinlat * sinlat);
        let alt: number = p / coslat - N;

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
        let p: number[] = this.llaToEcef(lat, lon, alt);
        let px: number[] = this.llaToEcef(lat, lon + eps, alt);
        let mx: number[] = this.llaToEcef(lat, lon - eps, alt);
        let py: number[] = this.llaToEcef(lat + eps, lon, alt);
        let my: number[] = this.llaToEcef(lat - eps, lon, alt);
        let pz: number[] = this.llaToEcef(lat, lon, alt + eps);
        let mz: number[] = this.llaToEcef(lat, lon, alt - eps);
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
