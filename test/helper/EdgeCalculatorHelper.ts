import { Node } from "../../src/graph/Node";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { LatLonAlt } from "../../src/api/interfaces/LatLonAlt";
import { PotentialEdge } from "../../src/graph/edge/interfaces/PotentialEdge";
import { CameraType } from "../../src/geo/interfaces/CameraType";

export class EdgeCalculatorHelper {
    public createPotentialEdge(key: string = "pkey"): PotentialEdge {
        return {
            capturedAt: 0,
            directionChange: 0,
            distance: 0,
            spherical: false,
            id: key,
            motionChange: 0,
            rotation: 0,
            sameMergeCC: false,
            sameSequence: false,
            sameUser: false,
            sequenceId: "skey",
            verticalDirectionChange: 0,
            verticalMotion: 0,
            worldMotionAzimuth: 0,
        };
    }

    public createCoreNode(
        key: string,
        latLonAlt: LatLonAlt,
        sequenceKey: string): Node {

        let coreNode: CoreImageEnt = {
            computed_geometry: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            id: key,
            geometry: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            sequence: { id: sequenceKey },
        };

        return new Node(coreNode);
    }

    public createFullNode(
        key: string = "key",
        latLonAlt: LatLonAlt = { alt: 0, lat: 0, lon: 0 },
        sequenceKey: string = "skey",
        r: number[] = [0, 0, 0],
        mergeCC: number = 2,
        cameraType: CameraType = "perspective",
        capturedAt: number = 0,
        mergeVersion: number = 1): Node {

        let node: Node = this.createCoreNode(key, latLonAlt, sequenceKey);

        let fillNode: SpatialImageEnt = {
            altitude: 0,
            atomic_scale: 0,
            computed_rotation: r,
            compass_angle: 0,
            computed_altitude: latLonAlt.alt,
            camera_parameters: cameraType === "spherical" ?
                [] : [1, 0, 0],
            camera_type: cameraType,
            captured_at: capturedAt,
            computed_compass_angle: 0,
            cluster: {
                id: "ckey",
                url: "ckey-url",
            },
            creator: { id: "ukey", username: "uname" },
            exif_orientation: 0,
            height: 0,
            id: "key",
            merge_cc: mergeCC,
            merge_version: mergeVersion,
            mesh: { id: "mesh-id", url: "mesh-url" },
            private: false,
            owner: { id: null },
            thumb: { id: "thumb-id", url: "thumb-url" },
            width: 0,
        };

        node.makeFull(fillNode);

        return node;
    }

    public createDefaultNode(spherical: boolean = false): Node {
        let key: string = "key";
        let sequenceKey: string = "skey";
        let latLonAlt: LatLonAlt = { alt: 0, lat: 0, lon: 0 };

        let cameraType: CameraType = spherical ?
            "spherical" :
            null;

        return this.createFullNode(key, latLonAlt, sequenceKey, [0, 0, 0], 2, cameraType, 0);
    }
}