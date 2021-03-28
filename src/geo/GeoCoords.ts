const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const WGS84A = 6378137.0;
const WGS84B = 6356752.31424518;

/**
 * Convert coordinates from geodetic (WGS84) reference to local topocentric
 * (ENU) reference.
 *
 * @param {number} lng Longitude in degrees.
 * @param {number} lat Latitude in degrees.
 * @param {number} alt Altitude in meters.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The x, y, z local topocentric ENU coordinates.
 */
export function geodeticToEnu(
    lng: number,
    lat: number,
    alt: number,
    refLng: number,
    refLat: number,
    refAlt: number)
    : number[] {

    const ecef = geodeticToEcef(
        lng,
        lat,
        alt);

    return ecefToEnu(
        ecef[0],
        ecef[1],
        ecef[2],
        refLng,
        refLat,
        refAlt);
}

/**
 * Convert coordinates from local topocentric (ENU) reference to
 * geodetic (WGS84) reference.
 *
 * @param {number} x Topocentric ENU coordinate in East direction.
 * @param {number} y Topocentric ENU coordinate in North direction.
 * @param {number} z Topocentric ENU coordinate in Up direction.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The longitude, latitude in degrees
 * and altitude in meters.
 */
export function enuToGeodetic(
    x: number,
    y: number,
    z: number,
    refLng: number,
    refLat: number,
    refAlt: number)
    : number[] {

    const ecef = enuToEcef(
        x,
        y,
        z,
        refLng,
        refLat,
        refAlt);

    return ecefToGeodetic(
        ecef[0],
        ecef[1],
        ecef[2]);
}

/**
 * Convert coordinates from Earth-Centered, Earth-Fixed (ECEF) reference
 * to local topocentric (ENU) reference.
 *
 * @param {number} X ECEF X-value.
 * @param {number} Y ECEF Y-value.
 * @param {number} Z ECEF Z-value.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The x, y, z topocentric ENU coordinates in East, North
 * and Up directions respectively.
 */
export function ecefToEnu(
    X: number,
    Y: number,
    Z: number,
    refLng: number,
    refLat: number,
    refAlt: number)
    : number[] {

    const refEcef = geodeticToEcef(
        refLng,
        refLat,
        refAlt);

    const V = [
        X - refEcef[0],
        Y - refEcef[1],
        Z - refEcef[2],
    ];

    refLng = refLng * DEG2RAD;
    refLat = refLat * DEG2RAD;

    const cosLng = Math.cos(refLng);
    const sinLng = Math.sin(refLng);
    const cosLat = Math.cos(refLat);
    const sinLat = Math.sin(refLat);

    const x = -sinLng * V[0] + cosLng * V[1];
    const y = -sinLat * cosLng * V[0] - sinLat * sinLng * V[1] + cosLat * V[2];
    const z = cosLat * cosLng * V[0] + cosLat * sinLng * V[1] + sinLat * V[2];

    return [x, y, z];
}

/**
 * Convert coordinates from local topocentric (ENU) reference
 * to Earth-Centered, Earth-Fixed (ECEF) reference.
 *
 * @param {number} x Topocentric ENU coordinate in East direction.
 * @param {number} y Topocentric ENU coordinate in North direction.
 * @param {number} z Topocentric ENU coordinate in Up direction.
 * @param {number} refLng Reference longitude in degrees.
 * @param {number} refLat Reference latitude in degrees.
 * @param {number} refAlt Reference altitude in meters.
 * @returns {Array<number>} The X, Y, Z ECEF coordinates.
 */
export function enuToEcef(
    x: number,
    y: number,
    z: number,
    refLng: number,
    refLat: number,
    refAlt: number)
    : number[] {

    const refEcef = geodeticToEcef(
        refLng,
        refLat,
        refAlt);

    refLng = refLng * DEG2RAD;
    refLat = refLat * DEG2RAD;

    const cosLng = Math.cos(refLng);
    const sinLng = Math.sin(refLng);
    const cosLat = Math.cos(refLat);
    const sinLat = Math.sin(refLat);

    const X =
        -sinLng * x
        - sinLat * cosLng * y
        + cosLat * cosLng * z
        + refEcef[0];

    const Y =
        cosLng * x
        - sinLat * sinLng * y
        + cosLat * sinLng * z
        + refEcef[1];

    const Z =
        cosLat * y +
        sinLat * z +
        refEcef[2];

    return [X, Y, Z];
}

/**
 * Convert coordinates from geodetic reference (WGS84) to Earth-Centered,
 * Earth-Fixed (ECEF) reference.
 *
 * @param {number} lng Longitude in degrees.
 * @param {number} lat Latitude in degrees.
 * @param {number} alt Altitude in meters.
 * @returns {Array<number>} The X, Y, Z ECEF coordinates.
 */
export function geodeticToEcef(
    lng: number,
    lat: number,
    alt: number)
    : number[] {
    const a = WGS84A;
    const b = WGS84B;

    lng = lng * DEG2RAD;
    lat = lat * DEG2RAD;

    const cosLng = Math.cos(lng);
    const sinLng = Math.sin(lng);
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    const a2 = a * a;
    const b2 = b * b;

    const L = 1.0 / Math.sqrt(a2 * cosLat * cosLat + b2 * sinLat * sinLat);

    const nhcl = (a2 * L + alt) * cosLat;

    const X = nhcl * cosLng;
    const Y = nhcl * sinLng;
    const Z = (b2 * L + alt) * sinLat;

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
    const a = WGS84A;
    const b = WGS84B;

    const a2 = a * a;
    const b2 = b * b;

    const a2mb2 = a2 - b2;

    const ea = Math.sqrt(a2mb2 / a2);
    const eb = Math.sqrt(a2mb2 / b2);

    const p = Math.sqrt(X * X + Y * Y);
    const theta = Math.atan2(Z * a, p * b);

    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const lng = Math.atan2(Y, X);
    const lat = Math.atan2(
        Z + eb * eb * b * sinTheta * sinTheta * sinTheta,
        p - ea * ea * a * cosTheta * cosTheta * cosTheta);

    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    const N = a / Math.sqrt(1 - ea * ea * sinLat * sinLat);
    const alt = p / cosLat - N;

    return [
        lng * RAD2DEG,
        lat * RAD2DEG,
        alt];
}
