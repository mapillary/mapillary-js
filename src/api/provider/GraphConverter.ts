import { ClusterContract } from '../contracts/ClusterContract';
import { MeshContract } from '../contracts/MeshContract';
import { CoreImageEnt } from '../ents/CoreImageEnt';
import { SpatialImageEnt } from '../ents/SpatialImageEnt';
import { LngLat } from '../interfaces/LngLat';
import { LngLatAlt } from '../interfaces/LngLatAlt';
import { GraphClusterContract } from './GraphContracts';
import {
    GraphCoreImageEnt,
    GraphGeometry,
    GraphSpatialImageEnt,
} from './GraphEnts';

const UNDISTORTION_MARGIN_FACTOR = 3;
const MIN_DEPTH = 5;
const MAX_DEPTH = 200;

export type MeshParameters = {
    scale: number;
    perspective: boolean;
};

type ProjectionModel = {
    cameraType: string;
    parameters: number[];
}

export function convertCameraType(cameraType: string, parameters: number[]): ProjectionModel {
    switch (cameraType) {
        case "equirectangular":
        case "spherical":
            return {cameraType: "spherical", parameters};
        case "perspective":
        case "fisheye":
            return {cameraType, parameters};
        default:
            return {cameraType: "perspective", parameters: [0.85, 0, 0]};
    }
}

export class GraphConverter {
    public clusterReconstruction(
        source: GraphClusterContract)
        : ClusterContract {

        const id: string = null;
        const colors: number[] = [];
        const coordinates: number[] = [];
        const pointIds: string[] = [];

        const points = source.points;
        const normalizer = 1 / 255;
        for (const pointId in points) {
            if (!points.hasOwnProperty(pointId)) {
                continue;
            }

            pointIds.push(pointId);
            const point = points[pointId];

            const color = point.color;
            colors.push(color[0] * normalizer);
            colors.push(color[1] * normalizer);
            colors.push(color[2] * normalizer);

            coordinates.push(...point.coordinates);
        }

        const lla = source.reference_lla;
        const reference: LngLatAlt = {
            alt: lla.altitude,
            lat: lla.latitude,
            lng: lla.longitude,
        };
        return {
            colors,
            coordinates,
            id,
            pointIds,
            reference,
            rotation: [0, 0, 0],
        };
    }

    public coreImage(
        source: GraphCoreImageEnt)
        : CoreImageEnt {

        const geometry = this._geometry(source.geometry);
        const computedGeometry = this._geometry(source.computed_geometry);
        const sequence = { id: source.sequence };
        const id = source.id;
        return {
            computed_geometry: computedGeometry,
            geometry,
            id,
            sequence,
        };
    }

    /**
     * Clamps the depth of the points to the [5, 200] meters interval to avoid
     * strange appearance.
     *
     * @param source Source mesh.
     * @param params Parameters.
     * @returns Converted mesh.
     */
    public mesh(source: MeshContract, params?: MeshParameters): MeshContract {
        const { vertices } = source;

        const scale = params && params.scale != null ? params.scale : 1;
        const scaleInv = 1 / scale;
        const perspective = params ? params.perspective : true;

        const zMin = scale * MIN_DEPTH;
        const zMax = scale * MAX_DEPTH;

        const numVertices = vertices.length / 3;

        for (let i = 0; i < numVertices; ++i) {
            const index = 3 * i;

            let x = vertices[index + 0];
            let y = vertices[index + 1];
            let z = vertices[index + 2];

            if (perspective) {
                // Workaround for corner points not being undistorted
                // during processing for perspective cameras.
                if (i < 4) {
                    x *= UNDISTORTION_MARGIN_FACTOR;
                    y *= UNDISTORTION_MARGIN_FACTOR;
                }

                const zBounded = Math.max(zMin, Math.min(z, zMax));
                const factor = zBounded / z;

                vertices[index + 0] = factor * x * scaleInv;
                vertices[index + 1] = factor * y * scaleInv;
                vertices[index + 2] = zBounded * scaleInv;
            } else {
                const l = Math.sqrt(x * x + y * y + z * z);
                const lBounded = Math.max(zMin, Math.min(l, zMax));
                const factor = lBounded / l;

                vertices[index + 0] = factor * x * scaleInv;
                vertices[index + 1] = factor * y * scaleInv;
                vertices[index + 2] = factor * z * scaleInv;
            }
        }

        return source;
    }

    public spatialImage(
        source: GraphSpatialImageEnt)
        : SpatialImageEnt {
        const {cameraType, parameters} = convertCameraType(source.camera_type, source.camera_parameters);
        source.camera_type = cameraType;
        source.camera_parameters = parameters;
        source.merge_id = source.merge_cc ? source.merge_cc.toString() : null;
        source.private = null;
        const thumbUrl = source.camera_type === 'spherical' ?
            source.thumb_2048_url : source.thumb_1024_url;
        source.thumb = source.thumb ?? { id: null, url: thumbUrl };

        source.cluster = source.sfm_cluster ?? { id: null, url: null };
        source.creator = source.creator ?? { id: null, username: null };
        source.owner = source.organization ?? { id: null };
        source.mesh = source.mesh ?? { id: null, url: null };

        return source;
    }

    private _geometry(geometry: GraphGeometry): LngLat {
        const coords = geometry?.coordinates;
        const lngLat: LngLat = coords ?
            {
                lat: coords[1],
                lng: coords[0],
            } : null;

        return lngLat;
    }
}
