import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeDirection,
    IEdge,
} from "../../../src/Edge";
import {Node, Sequence} from "../../../src/Graph";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

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
        let sequence: Sequence = new Sequence({ key: sequenceKey, keys: [key] });

        expect(() => { edgeCalculator.computeSequenceEdges(node, sequence); }).toThrowError(Error);
    });

    it("should throw when node sequence key differ from key of sequence", () => {
        let key: string = "key";
        let sequenceKey1: string = "skey1";
        let sequenceKey2: string = "skey2";

        let node: Node = helper.createCoreNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey1);
        let sequence: Sequence = new Sequence({ key: sequenceKey2, keys: [key] });

        expect(() => { edgeCalculator.computeSequenceEdges(node, sequence); }).toThrowError(Error);
    });

    it("should return a next edge", () => {
        let key: string = "key";
        let nextKey: string = "nextKey";
        let sequenceKey: string = "skey";

        let node: Node = helper.createFullNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey, [0, 0, 0]);
        let sequence: Sequence = new Sequence({ key: sequenceKey, keys: [key, nextKey] });

        let sequenceEdges: IEdge[] = edgeCalculator.computeSequenceEdges(node, sequence);

        expect(sequenceEdges.length).toBe(1);

        let sequenceEdge: IEdge = sequenceEdges[0];

        expect(sequenceEdge.to).toBe(nextKey);
        expect(sequenceEdge.data.direction).toBe(EdgeDirection.Next);
    });

    it("should return a prev edge", () => {
        let key: string = "key";
        let prevKey: string = "prevKey";
        let sequenceKey: string = "skey";

        let node: Node = helper.createFullNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey, [0, 0, 0]);
        let sequence: Sequence = new Sequence({ key: sequenceKey, keys: [prevKey, key] });

        let sequenceEdges: IEdge[] = edgeCalculator.computeSequenceEdges(node, sequence);

        expect(sequenceEdges.length).toBe(1);

        let sequenceEdge: IEdge = sequenceEdges[0];

        expect(sequenceEdge.to).toBe(prevKey);
        expect(sequenceEdge.data.direction).toBe(EdgeDirection.Prev);
    });

    it("should return a prev and a next edge", () => {
        let key: string = "key";
        let prevKey: string = "prevKey";
        let nextKey: string = "nextKey";

        let sequenceKey: string = "skey";

        let node: Node = helper.createFullNode(key, { alt: 0, lat: 0, lon: 0 }, sequenceKey, [0, 0, 0]);
        let sequence: Sequence = new Sequence({ key: sequenceKey, keys: [prevKey, key, nextKey] });

        let sequenceEdges: IEdge[] = edgeCalculator.computeSequenceEdges(node, sequence);

        expect(sequenceEdges.length).toBe(2);

        for (let sequenceEdge of sequenceEdges) {
            if (sequenceEdge.to === prevKey) {
                expect(sequenceEdge.data.direction).toBe(EdgeDirection.Prev);
            } else if (sequenceEdge.to === nextKey) {
                expect(sequenceEdge.data.direction).toBe(EdgeDirection.Next);
            }
        }
    });
});
