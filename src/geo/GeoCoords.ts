/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export class GeoCoords {
    // this is a translation of OpenSfM's geo.py

    private wgs84a: number = 6378137.0;
    private wgs84b: number = 6356752.314245;

    public topocentric_from_lla(lat: number, lon: number, alt: number, reflat: number, reflon: number, refalt: number): number[] {
        // transform from lat, lon, alt to topocentric XYZ.

        let TM: THREE.Matrix4 = new THREE.Matrix4().getInverse(this.ecef_from_topocentric_transform(reflat, reflon, refalt));
        let T: Float32Array = TM.elements;
        let p: number[] = this.ecef_from_lla(lat, lon, alt);
        let x: number = p[0];
        let y: number = p[1];
        let z: number = p[2];
        let tx: number = T[0] * x + T[4] * y + T[8] * z + T[12];
        let ty: number = T[1] * x + T[5] * y + T[9] * z + T[13];
        let tz: number = T[2] * x + T[6] * y + T[10] * z + T[14];

        return [tx, ty, tz];
    }

    public lla_from_topocentric(x: number, y: number, z: number, reflat: number, reflon: number, refalt: number): number[] {
        // transform from topocentric XYZ to lat, lon, alt.

        let T: Float32Array = this.ecef_from_topocentric_transform(reflat, reflon, refalt).elements;
        let ex: number = T[0] * x + T[4] * y + T[8] * z + T[12];
        let ey: number = T[1] * x + T[5] * y + T[9] * z + T[13];
        let ez: number = T[2] * x + T[6] * y + T[10] * z + T[14];

        return this.lla_from_ecef(ex, ey, ez);
    }

    private ecef_from_lla(lat: number, lon: number, alt: number): number[] {
        // compute ECEF XYZ from latitude, longitude and altitude.
        // all using the WGS94 model.
        // altitude is the distance to the WGS94 ellipsoid.
        // check results here http://www.oc.nps.edu/oc2902w/coord/llhxyz.htm

        let a2: number = this.wgs84a * this.wgs84a;
        let b2: number = this.wgs84b * this.wgs84b;
        let latRad: number = lat / 180.0 * Math.PI;
        let lonRad: number = lon / 180.0 * Math.PI;
        let coslat: number = Math.cos(latRad);
        let sinlat: number = Math.sin(latRad);
        let coslon: number = Math.cos(lonRad);
        let sinlon: number = Math.sin(lonRad);
        let L: number = 1.0 / Math.sqrt(a2 * coslat * coslat + b2 * sinlat * sinlat);
        let x: number = (a2 * L + alt) * coslat * coslon;
        let y: number = (a2 * L + alt) * coslat * sinlon;
        let z: number = (b2 * L + alt) * sinlat;

        return [x, y, z];
    }


    private lla_from_ecef(x: number, y: number, z: number): number[] {
        // compute latitude, longitude and altitude from ECEF XYZ.
        // all using the WGS94 model.
        // altitude is the distance to the WGS94 ellipsoid.

        let a: number = this.wgs84a;
        let b: number = this.wgs84b;
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

    private norm(v: number[]): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    private normalized(v: number[]): number[] {
        let n: number = this.norm(v);

        return [v[0] / n, v[1] / n, v[2] / n];
    }

    private ecef_from_topocentric_transform(lat: number, lon: number, alt: number): THREE.Matrix4 {
        // transformation from a topocentric frame at reference position to ECEF.
        // the topocentric reference frame is a metric one with the origin
        // at the given (lat, lon, alt) position, with the X axis heading east,
        // the Y axis heading north and the Z axis vertical to the ellipsoid.

        let eps: number = 1e-6;
        let p: number[] = this.ecef_from_lla(lat, lon, alt);
        let px: number[] = this.ecef_from_lla(lat, lon + eps, alt);
        let mx: number[] = this.ecef_from_lla(lat, lon - eps, alt);
        let py: number[] = this.ecef_from_lla(lat + eps, lon, alt);
        let my: number[] = this.ecef_from_lla(lat - eps, lon, alt);
        let pz: number[] = this.ecef_from_lla(lat, lon, alt + eps);
        let mz: number[] = this.ecef_from_lla(lat, lon, alt - eps);
        let v1: number[] = this.normalized([ px[0] - mx[0], px[1] - mx[1], px[2] - mx[2] ]);
        let v2: number[] = this.normalized([ py[0] - my[0], py[1] - my[1], py[2] - my[2] ]);
        let v3: number[] = this.normalized([ pz[0] - mz[0], pz[1] - mz[1], pz[2] - mz[2] ]);
        let T: THREE.Matrix4 = new THREE.Matrix4();
        T.set(v1[0], v2[0], v3[0], p[0],
              v1[1], v2[1], v3[1], p[1],
              v1[2], v2[2], v3[2], p[2],
              0, 0, 0, 1);

        return T;
    }
}

export default GeoCoords;
