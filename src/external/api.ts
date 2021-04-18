/**
 * @module api
 *
 * @description
 *
 * API module
 *
 * Classes and interfaces for extending Mapillary JS with
 * custom data providers loading and converting data in
 * any format.
 *
 * Geo coords
 *
 * Converts coordinates between the geodetic (WGS84),
 * Earth-Centered, Earth-Fixed (ECEF) and local topocentric
 * East, North, Up (ENU) reference frames.
 *
 * The WGS84 has longitude (degrees), latitude (degrees) and
 * altitude (meters) values.
 *
 * The ECEF Z-axis pierces the north pole and the
 * XY-axis defines the equatorial plane. The X-axis extends
 * from the geocenter to the intersection of the Equator and
 * the Greenwich Meridian. All values in meters.
 *
 * The WGS84 parameters are:
 *
 * ```js
 * a = 6378137
 * b = a * (1 - f)
 * f = 1 / 298.257223563
 * e = Math.sqrt((a^2 - b^2) / a^2)
 * e' = Math.sqrt((a^2 - b^2) / b^2)
 * ```
 *
 * The WGS84 to ECEF conversion is performed using the following:
 *
 * ```js
 * X = (N - h) * cos(phi) * cos(lambda)
 * Y = (N + h) * cos(phi) * sin(lambda)
 * Z = (b^2 * N / a^2 + h) * sin(phi)
 * ```
 *
 * where
 *
 * ```js
 * phi = latitude
 * lambda = longitude
 * h = height above ellipsoid (altitude)
 * N = Radius of curvature (meters)
 *   = a / Math.sqrt(1 - e^2 * sin(phi)^2)
 * ```
 *
 * The ECEF to WGS84 conversion is performed using the following:
 *
 * ```js
 * phi = arctan((Z + e'^2 * b * sin(theta)^3) / (p - e^2 * a * cos(theta)^3))
 * lambda = arctan(Y / X)
 * h = p / cos(phi) - N
 * ```
 *
 * where
 *
 * ```js
 * p = Math.sqrt(X^2 + Y^2)
 * theta = arctan(Z * a / p * b)
 * ```
 *
 * In the ENU reference frame the x-axis points to the
 * East, the y-axis to the North and the z-axis Up. All values
 * in meters.
 *
 * The ECEF to ENU conversion is performed using the following:
 *
 * ```js
 *     |       -sin(lambda_r)                cos(lambda_r)             0      |
 * T = | -sin(phi_r) * cos(lambda_r)  -sin(phi_r) * sin(lambda_r)  cos(phi_r) |
 *     |  cos(phi_r) * cos(lambda_r)   cos(phi_r) * sin(lambda_r)  sin(phi_r) |
 *
 *     | X - X_r |
 * V = | Y - Y_r |
 *     | Z - Z_r |
 *
 * | x |
 * | y | = T * V
 * | z |
 * ```
 *
 * where
 *
 * ```js
 * phi_r = latitude of reference
 * lambda_r = longitude of reference
 * X_r, Y_r, Z_r = ECEF coordinates of reference
 * ```
 *
 * The ENU to ECEF conversion is performed by solving the
 * above equation for X, Y, Z.
 *
 * WGS84 to ENU and ENU to WGS84 are two step conversions
 * with ECEF calculated in the first step for both conversions.
 */

// Geo
export {
    enuToGeodetic,
    geodeticToEnu,
} from "../geo/GeoCoords";

// Common
export {
    decompress,
    fetchArrayBuffer,
    readMeshPbf,
} from "../api/Common";

// Provider
export { DataProviderBase } from "../api/DataProviderBase";
export { GeohashGeometryProvider } from "../api/GeohashGeometryProvider";
export { GeometryProviderBase } from "../api/GeometryProviderBase";
export { S2GeometryProvider } from "../api/S2GeometryProvider";

// Falcor
export { FalcorDataProvider } from "../api/falcor/FalcorDataProvider";
export { FalcorDataProviderOptions }
    from "../api/falcor/FalcorDataProviderOptions";

// Event
export { ProviderCellEvent } from "../api/events/ProviderCellEvent";
export { ProviderEvent } from "../api/events/ProviderEvent";
export { ProviderEventType } from "../api/events/ProviderEventType";

// Contract
export { ClusterContract }
    from "../api/contracts/ClusterContract";
export { CoreImagesContract } from "../api/contracts/CoreImagesContract";
export { EntContract } from "../api/contracts/EntContract";
export { ImagesContract } from "../api/contracts/ImagesContract";
export { ImageTilesContract } from "../api/contracts/ImageTilesContract";
export { ImageTilesRequestContract }
    from "../api/contracts/ImageTilesRequestContract";
export { MeshContract } from "../api/contracts/MeshContract";
export { PointContract } from "../api/contracts/PointContract";
export { SequenceContract } from "../api/contracts/SequenceContract";
export { SpatialImagesContract } from "../api/contracts/SpatialImagesContract";

// Ent
export { CameraEnt } from "../api/ents/CameraEnt";
export { CoreImageEnt } from "../api/ents/CoreImageEnt";
export { CreatorEnt } from "../api/ents/CreatorEnt";
export { IDEnt } from "../api/ents/IDEnt";
export { ImageEnt } from "../api/ents/ImageEnt";
export { ImageTileEnt } from "../api/ents/ImageTileEnt";
export { SequenceEnt } from "../api/ents/SequenceEnt";
export { SpatialImageEnt } from "../api/ents/SpatialImageEnt";
export { URLEnt } from "../api/ents/URLEnt";

// Type
export { LngLat } from "../api/interfaces/LngLat";
export { LngLatAlt } from "../api/interfaces/LngLatAlt";

// Tile
export * as TileMath from '../tile/TileMath';
export {
    TileCoords2D,
    TileCoords3D,
    TileImageSize,
    TileLevel,
    TileLevelColumnRows,
    TilePixelCoords2D,
} from '../tile/interfaces/TileTypes';
