import {IAPINavImS, IAPINavImIm} from "../../src/API";
import {Node, Sequence} from "../../src/Graph";
import {IPotentialEdge} from "../../src/Edge";

export class EdgeCalculatorHelper {
    public createPotentialEdge(key: string = "pkey"): IPotentialEdge {
        return {
            apiNavImIm: { key: key },
            directionChange: 0,
            distance: 0,
            fullPano: false,
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
}

export default EdgeCalculatorHelper;
