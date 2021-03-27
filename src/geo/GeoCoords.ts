const wgs84a = 6378137.0;
const wgs84b = 6356752.31424518;

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
export function geodeticToEnu(
    lat: number,
    lon: number,
    alt: number,
    refLat: number,
    refLon: number,
    refAlt: number): number[] {

    let ecef: number[] = geodeticToEcef(lat, lon, alt);

    return ecefToEnu(ecef[0], ecef[1], ecef[2], refLat, refLon, refAlt);
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
export function enuToGeodetic(
    x: number,
    y: number,
    z: number,
    refLat: number,
    refLon: number,
    refAlt: number): number[] {

    let ecef: number[] = enuToEcef(x, y, z, refLat, refLon, refAlt);

    return ecefToGeodetic(ecef[0], ecef[1], ecef[2]);
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
export function ecefToEnu(
    X: number,
    Y: number,
    Z: number,
    refLat: number,
    refLon: number,
    refAlt: number): number[] {

    let refEcef: number[] = geodeticToEcef(refLat, refLon, refAlt);

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
export function enuToEcef(
    x: number,
    y: number,
    z: number,
    refLat: number,
    refLon: number,
    refAlt: number): number[] {

    let refEcef: number[] = geodeticToEcef(refLat, refLon, refAlt);

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
export function geodeticToEcef(lat: number, lon: number, alt: number): number[] {
    let a: number = wgs84a;
    let b: number = wgs84b;

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
export function ecefToGeodetic(X: number, Y: number, Z: number): number[] {
    let a: number = wgs84a;
    let b: number = wgs84b;

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
    let lat: number = Math.atan2(
        Z + eb * eb * b * sinTheta * sinTheta * sinTheta,
        p - ea * ea * a * cosTheta * cosTheta * cosTheta);

    let sinLat: number = Math.sin(lat);
    let cosLat: number = Math.cos(lat);

    let N: number = a / Math.sqrt(1 - ea * ea * sinLat * sinLat);
    let alt: number = p / cosLat - N;

    return [lat * 180.0 / Math.PI, lon * 180.0 / Math.PI, alt];
}
