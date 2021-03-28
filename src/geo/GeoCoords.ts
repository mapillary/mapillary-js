const wgs84a = 6378137.0;
const wgs84b = 6356752.31424518;

/**
 * Convert coordinates from geodetic (WGS84) reference to local topocentric
 * (ENU) reference.
 *
 * @param {number} lat Latitude in degrees.
 * @param {number} lng Longitude in degrees.
 * @param {number} alt Altitude in meters.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The x, y, z local topocentric ENU coordinates.
 */
export function geodeticToEnu(
    lat: number,
    lng: number,
    alt: number,
    refLat: number,
    refLng: number,
    refAlt: number)
    : number[] {

    let ecef: number[] = geodeticToEcef(lat, lng, alt);

    return ecefToEnu(ecef[0], ecef[1], ecef[2], refLat, refLng, refAlt);
}

/**
 * Convert coordinates from local topocentric (ENU) reference to
 * geodetic (WGS84) reference.
 *
 * @param {number} x Topocentric ENU coordinate in East direction.
 * @param {number} y Topocentric ENU coordinate in North direction.
 * @param {number} z Topocentric ENU coordinate in Up direction.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The longitude, latitude in degrees
 * and altitude in meters.
 */
export function enuToGeodetic(
    x: number,
    y: number,
    z: number,
    refLat: number,
    refLng: number,
    refAlt: number)
    : number[] {

    let ecef: number[] = enuToEcef(x, y, z, refLat, refLng, refAlt);

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
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The x, y, z topocentric ENU coordinates in East, North
 * and Up directions respectively.
 */
export function ecefToEnu(
    X: number,
    Y: number,
    Z: number,
    refLat: number,
    refLng: number,
    refAlt: number)
    : number[] {

    let refEcef: number[] = geodeticToEcef(refLat, refLng, refAlt);

    let V: number[] = [X - refEcef[0], Y - refEcef[1], Z - refEcef[2]];

    refLat = refLat * Math.PI / 180.0;
    refLng = refLng * Math.PI / 180.0;

    let cosLat: number = Math.cos(refLat);
    let sinLat: number = Math.sin(refLat);
    let cosLng: number = Math.cos(refLng);
    let sinLng: number = Math.sin(refLng);

    let x: number = -sinLng * V[0] + cosLng * V[1];
    let y: number = -sinLat * cosLng * V[0] - sinLat * sinLng * V[1] + cosLat * V[2];
    let z: number = cosLat * cosLng * V[0] + cosLat * sinLng * V[1] + sinLat * V[2];

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
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The X, Y, Z ECEF coordinates.
 */
export function enuToEcef(
    x: number,
    y: number,
    z: number,
    refLat: number,
    refLng: number,
    refAlt: number)
    : number[] {

    let refEcef: number[] = geodeticToEcef(refLat, refLng, refAlt);

    refLat = refLat * Math.PI / 180.0;
    refLng = refLng * Math.PI / 180.0;

    let cosLat: number = Math.cos(refLat);
    let sinLat: number = Math.sin(refLat);
    let cosLng: number = Math.cos(refLng);
    let sinLng: number = Math.sin(refLng);

    let X: number = -sinLng * x - sinLat * cosLng * y + cosLat * cosLng * z + refEcef[0];
    let Y: number = cosLng * x - sinLat * sinLng * y + cosLat * sinLng * z + refEcef[1];
    let Z: number = cosLat * y + sinLat * z + refEcef[2];

    return [X, Y, Z];
}

/**
 * Convert coordinates from geodetic reference (WGS84) to Earth-Centered,
 * Earth-Fixed (ECEF) reference.
 *
 * @param {number} lat Latitude in degrees.
 * @param {number} lng Longitude in degrees.
 * @param {number} alt Altitude in meters.
 * @returns {Array<number>} The X, Y, Z ECEF coordinates.
 */
export function geodeticToEcef(
    lat: number,
    lng: number,
    alt: number)
    : number[] {
    let a: number = wgs84a;
    let b: number = wgs84b;

    lat = lat * Math.PI / 180.0;
    lng = lng * Math.PI / 180.0;

    let cosLat: number = Math.cos(lat);
    let sinLat: number = Math.sin(lat);
    let cosLng: number = Math.cos(lng);
    let sinLng: number = Math.sin(lng);

    let a2: number = a * a;
    let b2: number = b * b;

    let L: number = 1.0 / Math.sqrt(a2 * cosLat * cosLat + b2 * sinLat * sinLat);

    let nhcl: number = (a2 * L + alt) * cosLat;

    let X: number = nhcl * cosLng;
    let Y: number = nhcl * sinLng;
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
 * @returns {Array<number>} The longitude, latitude in degrees
 * and altitude in meters.
 */
export function ecefToGeodetic(
    X: number,
    Y: number,
    Z: number)
    : number[] {
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

    let lng: number = Math.atan2(Y, X);
    let lat: number = Math.atan2(
        Z + eb * eb * b * sinTheta * sinTheta * sinTheta,
        p - ea * ea * a * cosTheta * cosTheta * cosTheta);

    let sinLat: number = Math.sin(lat);
    let cosLat: number = Math.cos(lat);

    let N: number = a / Math.sqrt(1 - ea * ea * sinLat * sinLat);
    let alt: number = p / cosLat - N;

    return [lat * 180.0 / Math.PI, lng * 180.0 / Math.PI, alt];
}
