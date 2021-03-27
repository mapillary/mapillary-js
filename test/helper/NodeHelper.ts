import { CameraType } from "../../src/geo/interfaces/CameraType";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { ImageEnt } from "../../src/api/ents/ImageEnt";
import { Node } from "../../src/graph/Node";

export class NodeHelper {
    private _clusterKey: string = "ckey";
    private _nodeKey: string = "nkey";
    private _sequenceKey: string = "skey";
    private _userKey: string = "ukey";
    private _username: string = "uname";

    public createCoreNode(): CoreImageEnt {
        return {
            computed_geometry: { lat: 0, lon: 0 },
            id: this._nodeKey,
            geometry: { lat: 0, lon: 0 },
            sequence: { id: this._sequenceKey },
        };
    }

    public createFillNode(): SpatialImageEnt {
        return {
            altitude: 0,
            atomic_scale: 0,
            camera_parameters: [1, 0, 0],
            camera_type: "perspective",
            captured_at: 0,
            computed_rotation: [0, 0, 0],
            compass_angle: 0,
            computed_altitude: 0,
            computed_compass_angle: 0,
            cluster: {
                id: this._clusterKey,
                url: this._clusterKey + "_url",
            },
            creator: { id: this._userKey, username: this._username },
            exif_orientation: 0,
            height: 1,
            id: "id",
            merge_cc: 0,
            merge_version: 0,
            mesh: { id: "mesh-id", url: "mesh-url" },
            owner: { id: null },
            private: false,
            thumb: { id: "thumb-id", url: "thumb-url" },
            width: 1,
        };
    }

    public createFullNode(): ImageEnt {
        return {
            altitude: 0,
            atomic_scale: 0,
            computed_rotation: [0, 0, 0],
            compass_angle: 0,
            computed_altitude: 0,
            camera_parameters: [1, 0, 0],
            camera_type: "perspective",
            captured_at: 0,
            computed_compass_angle: 0,
            computed_geometry: { lat: 0, lon: 0 },
            cluster: {
                id: this._clusterKey,
                url: this._clusterKey + "_url",
            },
            creator: { id: this._userKey, username: this._username },
            exif_orientation: 0,
            geometry: { lat: 0, lon: 0 },
            height: 1,
            id: this._nodeKey,
            merge_cc: 1,
            merge_version: 1,
            mesh: { id: "mesh-id", url: "mesh-url" },
            owner: { id: null },
            private: false,
            sequence: { id: this._sequenceKey },
            thumb: { id: "thumb-id", url: "thumb-url" },
            width: 1,
        };
    }

    public createNode(cameraType: CameraType = "perspective"): Node {
        let fullNode = this.createFullNode();
        fullNode.camera_type = cameraType;
        let node = new Node(fullNode);
        node.makeFull(fullNode);
        return node;
    }

    public createUnmergedNode(): Node {
        let fullNode: ImageEnt = this.createFullNode();

        fullNode.atomic_scale = undefined;
        fullNode.compass_angle = undefined;
        fullNode.computed_altitude = undefined;
        fullNode.camera_parameters = undefined;
        fullNode.camera_type = undefined;
        fullNode.computed_geometry = undefined;
        fullNode.merge_cc = undefined;
        fullNode.merge_version = undefined;

        let node: Node = new Node(fullNode);
        node.makeFull(fullNode);

        return node;
    }
}