import { CameraProjectionType } from "../../src/api/interfaces/CameraProjectionType";
import { ICoreNode } from "../../src/api/interfaces/ICoreNode";
import { IFillNode } from "../../src/api/interfaces/IFillNode";
import { IFullNode } from "../../src/api/interfaces/IFullNode";
import { Node } from "../../src/graph/Node";

export class NodeHelper {
    private _clusterKey: string = "ckey";
    private _nodeKey: string = "nkey";
    private _sequenceKey: string = "skey";
    private _userKey: string = "ukey";
    private _username: string = "uname";

    public createCoreNode(): ICoreNode {
        return {
            cl: { lat: 0, lon: 0 },
            key: this._nodeKey,
            l: { lat: 0, lon: 0 },
            sequence_key: this._sequenceKey,
        };
    }

    public createFillNode(): IFillNode {
        return {
            atomic_scale: 0,
            c_rotation: [0, 0, 0],
            ca: 0,
            calt: 0,
            camera_projection_type: "perspective",
            captured_at: 0,
            cca: 0,
            cfocal: 0,
            cluster_key: this._clusterKey,
            cluster_url: this._clusterKey = "_url",
            height: 1,
            merge_cc: 0,
            merge_version: 0,
            orientation: 0,
            private: false,
            user: { key: this._userKey, username: this._username },
            width: 1,
        };
    }

    public createFullNode(): IFullNode {
        return {
            atomic_scale: 0,
            c_rotation: [0, 0, 0],
            ca: 0,
            calt: 0,
            camera_projection_type: "perspective",
            captured_at: 0,
            cca: 0,
            cfocal: 0,
            cl: { lat: 0, lon: 0 },
            cluster_key: this._clusterKey,
            cluster_url: this._clusterKey = "_url",
            height: 1,
            key: this._nodeKey,
            l: { lat: 0, lon: 0 },
            merge_cc: 1,
            merge_version: 1,
            orientation: 0,
            private: false,
            sequence_key: this._sequenceKey,
            user: { key: this._userKey, username: this._username },
            width: 1,
        };
    }

    public createNode(cameraType: CameraProjectionType = "perspective"): Node {
        let fullNode = this.createFullNode();
        fullNode.camera_projection_type = cameraType;
        let node = new Node(fullNode);
        node.makeFull(fullNode);
        return node;
    }

    public createUnmergedNode(): Node {
        let fullNode: IFullNode = this.createFullNode();

        fullNode.atomic_scale = undefined;
        fullNode.ca = undefined;
        fullNode.calt = undefined;
        fullNode.cfocal = undefined;
        fullNode.cl = undefined;
        fullNode.merge_cc = undefined;
        fullNode.merge_version = undefined;

        let node: Node = new Node(fullNode);
        node.makeFull(fullNode);

        return node;
    }
}
