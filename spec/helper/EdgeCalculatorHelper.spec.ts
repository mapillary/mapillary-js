import {IAPINavImS, IAPINavImIm, ICoreNode, IFillNode, IGPano} from "../../src/API";
import {IPotentialEdge} from "../../src/Edge";
import {NewNode, Node, Sequence} from "../../src/Graph";
import {ILatLonAlt} from "../../src/Geo";

export class EdgeCalculatorHelper {
    public createPotentialEdge(key: string = "pkey"): IPotentialEdge {
        return {
            capturedAt: 0,
            directionChange: 0,
            distance: 0,
            fullPano: false,
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

    public createNode(fullPano: boolean = false): Node {
        let key: string = "key";

        let apiNavImS: IAPINavImS = { key: "skey", keys: [key] };
        let sequence: Sequence = new Sequence(apiNavImS);

        let apiNavImIm: IAPINavImIm = { key: key };

        if (fullPano) {
            apiNavImIm.gpano = {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            };
        }

        let node: Node = new Node(0, {lat: 0, lon: 0}, true, sequence, apiNavImIm, []);

        return node;
    }

    public createNonFullNewNode(
        key: string,
        latLonAlt: ILatLonAlt,
        sequenceKey: string): NewNode {

        let coreNode: ICoreNode = {
            ca: 0,
            cca: 0,
            cl: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            key: key,
            l: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            sequence: { key: sequenceKey },
        };

        return new NewNode(coreNode);
    }

    public createFullNode(
            key: string = "key",
            latLonAlt: ILatLonAlt = { alt: 0, lat: 0, lon: 0 },
            sequenceKey: string = "skey",
            r: number[] = [0, 0, 0],
            mergeCC: number = 2,
            gpano: IGPano = null,
            capturedAt: number = 0,
            mergeVersion: number = 1): NewNode {

        let node: NewNode = this.createNonFullNewNode(key, latLonAlt, sequenceKey);

        let fillNode: IFillNode = {
            atomic_scale: 0,
            c_rotation: r,
            calt: latLonAlt.alt,
            captured_at: capturedAt,
            cfocal: 0,
            gpano: gpano,
            height: 0,
            merge_cc: mergeCC,
            merge_version: mergeVersion,
            orientation: 0,
            user: { key: "ukey", username: "uname" },
            width: 0,
        };

        node.makeFull(fillNode);

        return node;
    }

    public createDefaultNode(fullPano: boolean = false): NewNode {
        let key: string = "key";
        let sequenceKey: string = "skey";
        let latLonAlt: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };

        let gpano: IGPano = fullPano ?
            {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            } :
            null;

        return this.createFullNode(key, latLonAlt, sequenceKey, [0, 0, 0], 2, gpano, 0);
    }
}

export default EdgeCalculatorHelper;
