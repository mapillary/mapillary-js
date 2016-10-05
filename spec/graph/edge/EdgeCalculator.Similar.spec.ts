/// <reference path="../../../typings/index.d.ts" />

import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeDirection,
    IEdge,
    IPotentialEdge,
} from "../../../src/Edge";
import {Node} from "../../../src/Graph";
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.computeSimilarEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let node: Node;
    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode();

        potentialEdge = helper.createPotentialEdge();
    });

    it("should have a similar edge", () => {
        potentialEdge.apiNavImIm.captured_at = 24234;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: IEdge = similarEdges[0];

        expect(similarEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(similarEdge.data.direction).toBe(EdgeDirection.Similar);
    });

    it("should not have a similar edge if sequence is missing on potential edge", () => {
        potentialEdge.apiNavImIm.captured_at = 24234;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = null;

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if node is full pano and potential node is not full pano", () => {
        node = helper.createNode(true);

        potentialEdge.sameMergeCC = true;
        potentialEdge.sameSequence = true;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if same sequence", () => {
        potentialEdge.sameMergeCC = true;
        potentialEdge.sameSequence = true;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if not same merge cc", () => {
        potentialEdge.sameMergeCC = false;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if distance is above threshold", () => {
        settings.similarMaxDistance = 5;

        potentialEdge.distance = 8;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if rotation is above threshold", () => {
        settings.similarMaxDirectionChange = 0.5;

        potentialEdge.directionChange = 1;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should have a similar edge even if rotation is above threshold when potential is full pano", () => {
        settings.similarMaxDirectionChange = 0.5;

        potentialEdge.directionChange = 1;
        potentialEdge.fullPano = true;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = "other";

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: IEdge = similarEdges[0];

        expect(similarEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(similarEdge.data.direction).toBe(EdgeDirection.Similar);
    });

    it("should not have a similar edge for the same user within min time diff", () => {
        settings.similarMinTimeDifference = 100;

        node.apiNavImIm.captured_at = 1000;

        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = "other";
        potentialEdge.sameUser = true;
        potentialEdge.apiNavImIm.captured_at = 1050;

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should have a similar edge for the same user if above min time diff", () => {
        settings.similarMinTimeDifference = 100;

        node.apiNavImIm.captured_at = 1000;

        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceKey = "other";
        potentialEdge.sameUser = true;
        potentialEdge.apiNavImIm.captured_at = 1200;

        let similarEdges: IEdge[] = edgeCalculator.computeSimilarEdges(node, [potentialEdge]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: IEdge = similarEdges[0];

        expect(similarEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(similarEdge.data.direction).toBe(EdgeDirection.Similar);
    });

    it("should have a multiple similar edges from different sequences", () => {
        let potentialEdge1: IPotentialEdge = helper.createPotentialEdge();
        let potentialEdge2: IPotentialEdge = helper.createPotentialEdge();

        potentialEdge1.apiNavImIm.key = "k1";
        potentialEdge1.sameMergeCC = true;
        potentialEdge1.sequenceKey = "s1";

        potentialEdge2.apiNavImIm.key = "k2";
        potentialEdge2.sameMergeCC = true;
        potentialEdge2.sequenceKey = "s2";

        let similarEdges: IEdge[] =
            edgeCalculator.computeSimilarEdges(node, [potentialEdge1, potentialEdge2]);

        expect(similarEdges.length).toBe(2);

        for (let similarEdge of similarEdges) {
            expect(similarEdge.data.direction).toBe(EdgeDirection.Similar);
        }

        for (let key of [potentialEdge1.apiNavImIm.key, potentialEdge2.apiNavImIm.key]) {
            let count: number = 0;

            for (let similarEdge of similarEdges) {
                if (similarEdge.to === key) {
                    count++;
                }
            }

            expect(count).toBe(1);
        }
    });

    it("should have only one similar edge for a sequence based on distance", () => {
        let potentialEdge1: IPotentialEdge = helper.createPotentialEdge();
        let potentialEdge2: IPotentialEdge = helper.createPotentialEdge();

        potentialEdge1.apiNavImIm.key = "k1";
        potentialEdge1.distance = 2;
        potentialEdge1.sameMergeCC = true;
        potentialEdge1.sequenceKey = "s1";

        potentialEdge2.apiNavImIm.key = "k2";
        potentialEdge2.distance = 1;
        potentialEdge2.sameMergeCC = true;
        potentialEdge2.sequenceKey = "s1";

        let similarEdges: IEdge[] =
            edgeCalculator.computeSimilarEdges(node, [potentialEdge1, potentialEdge2]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: IEdge = similarEdges[0];

        expect(similarEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(similarEdge.data.direction).toBe(EdgeDirection.Similar);
    });

    it("should have only one similar edge for a sequence based on rotation", () => {
        let potentialEdge1: IPotentialEdge = helper.createPotentialEdge();
        let potentialEdge2: IPotentialEdge = helper.createPotentialEdge();

        potentialEdge1.apiNavImIm.key = "k1";
        potentialEdge1.rotation = 2;
        potentialEdge1.sameMergeCC = true;
        potentialEdge1.sequenceKey = "s1";

        potentialEdge2.apiNavImIm.key = "k2";
        potentialEdge2.rotation = 1;
        potentialEdge2.sameMergeCC = true;
        potentialEdge2.sequenceKey = "s1";

        let similarEdges: IEdge[] =
            edgeCalculator.computeSimilarEdges(node, [potentialEdge1, potentialEdge2]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: IEdge = similarEdges[0];

        expect(similarEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(similarEdge.data.direction).toBe(EdgeDirection.Similar);
    });
});
