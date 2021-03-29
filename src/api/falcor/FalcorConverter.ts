import { FalcorImageSize } from "./FalcorImageSize";
import { FalcorDataProviderUrls } from "./FalcorDataProviderUrls";
import {
    FalcorCoreImageEnt,
    FalcorSequenceEnt,
    FalcorSpatialImageEnt,
} from "./FalcorEnts";
import { CoreImageEnt } from "../ents/CoreImageEnt";
import { IDEnt } from "../ents/IDEnt";
import { SpatialImageEnt } from "../ents/SpatialImageEnt";
import { SequenceEnt } from "../ents/SequenceEnt";
import { ClusterReconstructionContract } from "../contracts/ClusterReconstructionContract";
import { LngLatAlt } from "../interfaces/LngLatAlt";
import { FalcorClusterReconstructionContract } from "./FalcorContracts";
import { isSpherical } from "../../geo/Geo";
import { LngLat } from "../interfaces/LngLat";
import { CameraShotContract } from "../contracts/CameraShotContract";

function convertCameraType(falcorProjectionType: string): string {
    return falcorProjectionType === "equirectangular" ?
        "spherical" : falcorProjectionType;
}

export class FalcorConverter {
    public readonly propertiesCore: string[];
    public readonly propertiesKey: string[];
    public readonly propertiesSequence: string[];
    public readonly propertiesSpatial: string[];
    public readonly propertiesUser: string[];

    constructor(private readonly _urls: FalcorDataProviderUrls) {
        this.propertiesCore = [
            "cl",
            "l",
            "sequence_key",
        ];

        this.propertiesKey = [
            "key",
        ];

        this.propertiesSequence = [
            "keys",
        ];

        this.propertiesSpatial = [
            "altitude",
            "atomic_scale",
            "c_rotation",
            "ca",
            "calt",
            "camera_projection_type",
            "captured_at",
            "cca",
            "cfocal",
            "cluster_key",
            "ck1",
            "ck2",
            "height",
            "merge_cc",
            "merge_version",
            "organization_key",
            "orientation",
            "private",
            "quality_score",
            "user",
            "width",
        ];

        this.propertiesUser = [
            "username",
        ];
    }

    public clusterReconstruction(
        item: FalcorClusterReconstructionContract): ClusterReconstructionContract {
        const cameras: ClusterReconstructionContract["cameras"] = {};
        for (const cameraId in item.cameras) {
            if (!item.cameras.hasOwnProperty(cameraId)) { continue; }
            const falcorCamera = item.cameras[cameraId];
            const cameraParameters = [
                falcorCamera.focal,
                falcorCamera.k1,
                falcorCamera.k2,
            ];
            const cameraType = convertCameraType(falcorCamera.projection_type);
            cameras[cameraId] = {
                camera_parameters: cameraParameters,
                camera_type: cameraType,
                id: cameraId,
            };
        }

        const id = item.key;
        const points = item.points;
        const lla = item.reference_lla;
        const reference: LngLatAlt = {
            alt: lla.altitude,
            lat: lla.latitude,
            lng: lla.longitude,
        };
        const shots = this._shots(item.shots);
        return {
            cameras,
            id,
            points,
            reference,
            shots,
        };
    }

    public core<T extends FalcorCoreImageEnt>(item: T): CoreImageEnt {
        const cl = item.cl;
        const computedGeometry: LngLat = cl ? {
            lat: cl.lat,
            lng: cl.lon,
        } : null;
        const geometry: LngLat = { lat: item.l.lat, lng: item.l.lon };
        const id = item.key;
        const sequence: IDEnt = { id: item.sequence_key };
        return {
            computed_geometry: computedGeometry,
            geometry,
            id,
            sequence,
        };
    }

    public sequence(item: FalcorSequenceEnt): SequenceEnt {
        const id = item.key;
        const imageIds = item.keys;
        return { id, image_ids: imageIds };
    }

    public spatial<T extends FalcorSpatialImageEnt>(
        item: T): SpatialImageEnt {
        const altitude = item.altitude;
        const atomicScale = item.atomic_scale;
        const cameraType = convertCameraType(item.camera_projection_type);
        const cameraParameters = [
            item.cfocal,
            item.ck1,
            item.ck2
        ];
        const capturedAt = item.captured_at;
        const cluster = {
            id: item.cluster_key,
            url: this._urls.clusterReconstruction(item.cluster_key),
        };
        const compassAngle = item.ca;
        const computedAltitude = item.calt;
        const computedCompassAngle = item.cca;
        const computedRotation = item.c_rotation;
        const height = item.height;
        const mergeCc = item.merge_cc;
        const mergeVersion = item.merge_version;
        const owner = { id: item.organization_key };
        const exifOrientation = item.orientation;
        const priv = item.private;
        const qualityScore = item.quality_score;
        const creator = {
            id: !!item.user ? item.user.key : null,
            username: !!item.user ? item.user.username : null,
        };
        const width = item.width;
        const id = item.key;
        const mesh = { id, url: this._urls.protoMesh(id) };
        const thumbSize = isSpherical(cameraType) ?
            FalcorImageSize.Size2048 :
            FalcorImageSize.Size1024;
        const thumbUrl = this._urls
            .thumbnail(id, thumbSize, this._urls.origin);
        const thumb = { id, url: thumbUrl }

        return {
            altitude,
            atomic_scale: atomicScale,
            camera_parameters: cameraParameters,
            camera_type: cameraType,
            captured_at: capturedAt,
            cluster,
            compass_angle: compassAngle,
            computed_altitude: computedAltitude,
            computed_compass_angle: computedCompassAngle,
            computed_rotation: computedRotation,
            creator,
            exif_orientation: exifOrientation,
            height,
            merge_cc: mergeCc,
            merge_version: mergeVersion,
            mesh,
            id,
            owner,
            private: priv,
            quality_score: qualityScore,
            thumb,
            width,
        }
    }

    private _shots(
        falcorShots: FalcorClusterReconstructionContract["shots"])
        : ClusterReconstructionContract["shots"] {
        const contracts: ClusterReconstructionContract["shots"] = {};
        for (const imageId in falcorShots) {
            if (!falcorShots.hasOwnProperty(imageId)) { continue; }
            const falcorShot = falcorShots[imageId];
            const shot: CameraShotContract = {
                cameraId: falcorShot.camera,
                imageId,
                rotation: falcorShot.rotation,
                translation: falcorShot.translation,
            };
            contracts[imageId] = shot;
        }

        return contracts;
    }
}
