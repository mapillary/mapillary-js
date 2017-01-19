import {
    ICoreNode,
    IFillNode,
    IFullNode,
    IGPano,
} from "../../src/API";
import {Node} from "../../src/Graph";

export class NodeHelper {
    private _nodeKey: string = "nkey";
    private _sequenceKey: string = "skey";
    private _userKey: string = "ukey";
    private _username: string = "uname";

    public createCoreNode(): ICoreNode {
        return {
            cl: { lat: 0, lon: 0 },
            key: this._nodeKey,
            l: { lat: 0, lon: 0},
            sequence: { key: this._sequenceKey },
        };
    }

    public createFillNode(): IFillNode {
        return {
            atomic_scale: 0,
            c_rotation: [0, 0, 0],
            ca: 0,
            calt: 0,
            captured_at: 0,
            cca: 0,
            cfocal: 0,
            gpano: null,
            height: 0,
            merge_cc: 0,
            merge_version: 0,
            orientation: 0,
            user: { key: this._userKey, username: this._username },
            width: 0,
        };
    }

    public createFullNode(): IFullNode {
        return {
            atomic_scale: 0,
            c_rotation: [0, 0, 0],
            ca: 0,
            calt: 0,
            captured_at: 0,
            cca: 0,
            cfocal: 0,
            cl: { lat: 0, lon: 0 },
            gpano: null,
            height: 0,
            key: this._nodeKey,
            l: { lat: 0, lon: 0},
            merge_cc: 0,
            merge_version: 0,
            orientation: 0,
            sequence: { key: this._sequenceKey },
            user: { key: this._userKey, username: this._username },
            width: 0,
        };
    }

    public createNode(gpano?: IGPano): Node {
        let fullNode: IFullNode = this.createFullNode();
        fullNode.gpano = gpano;

        let node: Node = new Node(fullNode);
        node.makeFull(fullNode);

        return node;
    };
}

export default NodeHelper;
