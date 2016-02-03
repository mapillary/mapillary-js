import {IAPINavImS, IAPINavImIm} from "../../src/API";
import {Node, Sequence} from "../../src/Graph";
import {IPotentialEdge} from "../../src/Edge";

export class EdgeCalculatorHelper {
    public createPotentialEdge(key: string = "pkey"): IPotentialEdge {
        return {
            distance: 0,
            motionChange: 0,
            verticalMotion: 0,
            directionChange: 0,
            verticalDirectionChange: 0,
            rotation: 0,
            worldMotionAzimuth: 0,
            sameSequence: false,
            sameMergeCc: false,
            fullPano: false,
            apiNavImIm: { key: key }
        };
    }

    public createNode(fullPano = false): Node {
        let key: string = "key";

        let apiNavImS: IAPINavImS = { key: "skey", keys: [key] };
        let sequence: Sequence = new Sequence(apiNavImS);

        let apiNavImIm: IAPINavImIm = { key: key };

        if (fullPano) {
            apiNavImIm.gpano = {
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaImageHeightPixels: 1,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        }

        let node: Node = new Node(key, 0, {lat: 0, lon: 0}, true, sequence, apiNavImIm, [0, 0, 0], []);

        return node;
    }
}

export default EdgeCalculatorHelper;