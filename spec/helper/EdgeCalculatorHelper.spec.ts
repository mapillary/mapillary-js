import {ICoreNode, IFillNode, IGPano} from "../../src/API";
import {IPotentialEdge} from "../../src/Edge";
import {Node} from "../../src/Graph";
import {ILatLonAlt} from "../../src/Geo";

export class EdgeCalculatorHelper {
    public createPotentialEdge(key: string = "pkey"): IPotentialEdge {
        return {
            capturedAt: 0,
            croppedPano: false,
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

    public createCoreNode(
        key: string,
        latLonAlt: ILatLonAlt,
        sequenceKey: string): Node {

        let coreNode: ICoreNode = {
            cl: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            key: key,
            l: { lat: latLonAlt.lat, lon: latLonAlt.lon },
            sequence_key: sequenceKey,
        };

        return new Node(coreNode);
    }

    public createFullNode(
            key: string = "key",
            latLonAlt: ILatLonAlt = { alt: 0, lat: 0, lon: 0 },
            sequenceKey: string = "skey",
            r: number[] = [0, 0, 0],
            mergeCC: number = 2,
            gpano: IGPano = null,
            capturedAt: number = 0,
            mergeVersion: number = 1): Node {

        let node: Node = this.createCoreNode(key, latLonAlt, sequenceKey);

        let fillNode: IFillNode = {
            atomic_scale: 0,
            c_rotation: r,
            ca: 0,
            calt: latLonAlt.alt,
            captured_at: capturedAt,
            cca: 0,
            cfocal: 0,
            cluster_key: "ckey",
            gpano: gpano,
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

    public createDefaultNode(fullPano: boolean = false): Node {
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
