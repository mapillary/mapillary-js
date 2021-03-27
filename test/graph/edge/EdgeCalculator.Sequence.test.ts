import { EdgeCalculator } from "../../../src/graph/edge/EdgeCalculator";
import { EdgeCalculatorDirections } from "../../../src/graph/edge/EdgeCalculatorDirections";
import { EdgeCalculatorSettings } from "../../../src/graph/edge/EdgeCalculatorSettings";
import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";
import { NavigationEdge } from "../../../src/graph/edge/interfaces/NavigationEdge";
import { Node } from "../../../src/graph/Node";
import { Sequence } from "../../../src/graph/Sequence";
import { EdgeCalculatorHelper } from "../../helper/EdgeCalculatorHelper";

describe("EdgeCalculator.computeSequenceEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    it("should throw when node is not full", () => {
        let key: string = "key";
        let sequenceKey: string = "skey";

        let node: Node = helper.createCoreNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey);
        let sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [key] });

        expect(() => { edgeCalculator.computeSequenceEdges(node, sequence); }).toThrowError(Error);
    });

    it("should throw when node sequence key differ from key of sequence", () => {
        let key: string = "key";
        let sequenceKey1: string = "skey1";
        let sequenceKey2: string = "skey2";

        let node: Node = helper.createCoreNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey1);
        let sequence: Sequence = new Sequence({ id: sequenceKey2, image_ids: [key] });

        expect(() => { edgeCalculator.computeSequenceEdges(node, sequence); }).toThrowError(Error);
    });

    it("should return a next edge", () => {
        let key: string = "key";
        let nextKey: string = "nextKey";
        let sequenceKey: string = "skey";

        let node: Node = helper.createFullNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey, [0, 0, 0]);
        let sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [key, nextKey] });

        let sequenceEdges: NavigationEdge[] = edgeCalculator.computeSequenceEdges(node, sequence);

        expect(sequenceEdges.length).toBe(1);

        let sequenceEdge: NavigationEdge = sequenceEdges[0];

        expect(sequenceEdge.target).toBe(nextKey);
        expect(sequenceEdge.data.direction).toBe(NavigationDirection.Next);
    });

    it("should return a prev edge", () => {
        let key: string = "key";
        let prevKey: string = "prevKey";
        let sequenceKey: string = "skey";

        let node: Node = helper.createFullNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey, [0, 0, 0]);
        let sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [prevKey, key] });

        let sequenceEdges: NavigationEdge[] = edgeCalculator.computeSequenceEdges(node, sequence);

        expect(sequenceEdges.length).toBe(1);

        let sequenceEdge: NavigationEdge = sequenceEdges[0];

        expect(sequenceEdge.target).toBe(prevKey);
        expect(sequenceEdge.data.direction).toBe(NavigationDirection.Prev);
    });

    it("should return a prev and a next edge", () => {
        let key: string = "key";
        let prevKey: string = "prevKey";
        let nextKey: string = "nextKey";

        let sequenceKey: string = "skey";

        let node: Node = helper.createFullNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey, [0, 0, 0]);
        let sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [prevKey, key, nextKey] });

        let sequenceEdges: NavigationEdge[] = edgeCalculator.computeSequenceEdges(node, sequence);

        expect(sequenceEdges.length).toBe(2);

        for (let sequenceEdge of sequenceEdges) {
            if (sequenceEdge.target === prevKey) {
                expect(sequenceEdge.data.direction).toBe(NavigationDirection.Prev);
            } else if (sequenceEdge.target === nextKey) {
                expect(sequenceEdge.data.direction).toBe(NavigationDirection.Next);
            }
        }
    });
});
