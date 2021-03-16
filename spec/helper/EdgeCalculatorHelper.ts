import { Node } from "../../src/graph/Node";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { LatLonAltEnt } from "../../src/api/ents/LatLonAltEnt";
import { PotentialEdge } from "../../src/graph/edge/interfaces/PotentialEdge";
import { CameraType } from "../../src/geo/interfaces/CameraType";

export class EdgeCalculatorHelper {
    public createPotentialEdge(key: string = "pkey"): PotentialEdge {
        return {
            capturedAt: 0,
            directionChange: 0,
            distance: 0,
            spherical: false,
            key: key,
            motionChange: 0,
            rotation: 0,
            sameMergeCC: false,
            sameSequence: false,
            sameUser: false,
            sequenceKey: "skey",
            verticalDirectionChange: 0,
            verticalMotion: 0,
            worldMotionAzimuth: 0,
        };
    }

    public createCoreNode(
        key: string,
        latLonAlt: LatLonAltEnt,
        sequenceKey: string): Node {

        let coreNode: CoreImageEnt = {
            cl: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            key: key,
            l: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            sequence_key: sequenceKey,
        };

        return new Node(coreNode);
    }

    public createFullNode(
        key: string = "key",
        latLonAlt: LatLonAltEnt = { alt: 0, lat: 0, lon: 0 },
        sequenceKey: string = "skey",
        r: number[] = [0, 0, 0],
        mergeCC: number = 2,
        cameraType: CameraType = "perspective",
        capturedAt: number = 0,
        mergeVersion: number = 1): Node {

        let node: Node = this.createCoreNode(key, latLonAlt, sequenceKey);

        let fillNode: SpatialImageEnt = {
            atomic_scale: 0,
            c_rotation: r,
            ca: 0,
            calt: latLonAlt.alt,
            camera_parameters: cameraType === "equirectangular" ?
                [] : [1, 0, 0],
            camera_type: cameraType,
            captured_at: capturedAt,
            cca: 0,
            cluster_key: "ckey",
            height: 0,
            merge_cc: mergeCC,
            merge_version: mergeVersion,
            orientation: 0,
            private: false,
            user: { key: "ukey", username: "uname" },
            width: 0,
        };

        node.makeFull(fillNode);

        return node;
    }

    public createDefaultNode(spherical: boolean = false): Node {
        let key: string = "key";
        let sequenceKey: string = "skey";
        let latLonAlt: LatLonAltEnt = { alt: 0, lat: 0, lon: 0 };

        let cameraType: CameraType = spherical ?
            "equirectangular" :
            null;

        return this.createFullNode(key, latLonAlt, sequenceKey, [0, 0, 0], 2, cameraType, 0);
    }
}
