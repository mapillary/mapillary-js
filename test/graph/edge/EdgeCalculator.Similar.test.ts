import { EdgeCalculator } from "../../../src/graph/edge/EdgeCalculator";
import { EdgeCalculatorDirections } from "../../../src/graph/edge/EdgeCalculatorDirections";
import { EdgeCalculatorSettings } from "../../../src/graph/edge/EdgeCalculatorSettings";
import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";
import { NavigationEdge } from "../../../src/graph/edge/interfaces/NavigationEdge";
import { PotentialEdge } from "../../../src/graph/edge/interfaces/PotentialEdge";
import { Image } from "../../../src/graph/Image";

import { EdgeCalculatorHelper } from "../../helper/EdgeCalculatorHelper";

describe("EdgeCalculator.computeSimilarEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let image: Image;
    let potentialEdge: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    let createImage: (capturedAt: number) => Image =
        (capturedAt: number): Image => {
            return helper.createCompleteImage("key", { alt: 0, lat: 0, lng: 0 }, "skey", [0, 0, 0], 2, "perspective", capturedAt);
        };

    beforeEach(() => {
        potentialEdge = helper.createPotentialEdge();
    });

    beforeEach(() => {
        image = helper.createDefaultImage();
    });

    it("should throw when image is not full", () => {
        image = helper.createCoreImage("", { alt: 0, lat: 0, lng: 0 }, "");

        expect(() => { edgeCalculator.computeSimilarEdges(image, []); }).toThrowError(Error);
    });

    it("should have a similar edge", () => {
        potentialEdge.capturedAt = 24234;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: NavigationEdge = similarEdges[0];

        expect(similarEdge.target).toBe(potentialEdge.id);
        expect(similarEdge.data.direction).toBe(NavigationDirection.Similar);
    });

    it("should not have a similar edge if sequence is missing on potential edge", () => {
        potentialEdge.capturedAt = 24234;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = null;

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if image is spherical and potential image is not spherical", () => {
        potentialEdge.sameMergeCC = true;
        potentialEdge.sameSequence = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if same sequence", () => {
        potentialEdge.sameMergeCC = true;
        potentialEdge.sameSequence = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should have a similar edge even if not same merge cc", () => {
        potentialEdge.sameMergeCC = false;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(1);
    });

    it("should have a similar edge if same merge cc", () => {
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(1);
    });

    it("should not have a similar edge if distance is above threshold", () => {
        settings.similarMaxDistance = 5;

        potentialEdge.distance = 8;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should not have a similar edge if rotation is above threshold", () => {
        settings.similarMaxDirectionChange = 0.5;

        potentialEdge.directionChange = 1;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should have a similar edge even if rotation is above threshold when potential is spherical", () => {
        settings.similarMaxDirectionChange = 0.5;

        potentialEdge.directionChange = 1;
        potentialEdge.spherical = true;
        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: NavigationEdge = similarEdges[0];

        expect(similarEdge.target).toBe(potentialEdge.id);
        expect(similarEdge.data.direction).toBe(NavigationDirection.Similar);
    });

    it("should not have a similar edge for the same user within min time diff", () => {
        image = createImage(1000);

        settings.similarMinTimeDifference = 100;

        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";
        potentialEdge.sameUser = true;
        potentialEdge.capturedAt = 1050;

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(0);
    });

    it("should have a similar edge for the same user if above min time diff", () => {
        image = createImage(1000);

        settings.similarMinTimeDifference = 100;

        potentialEdge.sameMergeCC = true;
        potentialEdge.sequenceId = "other";
        potentialEdge.sameUser = true;
        potentialEdge.capturedAt = 1200;

        let similarEdges: NavigationEdge[] = edgeCalculator.computeSimilarEdges(image, [potentialEdge]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: NavigationEdge = similarEdges[0];

        expect(similarEdge.target).toBe(potentialEdge.id);
        expect(similarEdge.data.direction).toBe(NavigationDirection.Similar);
    });

    it("should have a multiple similar edges from different sequences", () => {
        let potentialEdge1: PotentialEdge = helper.createPotentialEdge();
        let potentialEdge2: PotentialEdge = helper.createPotentialEdge();

        potentialEdge1.id = "k1";
        potentialEdge1.sameMergeCC = true;
        potentialEdge1.sequenceId = "s1";

        potentialEdge2.id = "k2";
        potentialEdge2.sameMergeCC = true;
        potentialEdge2.sequenceId = "s2";

        let similarEdges: NavigationEdge[] =
            edgeCalculator.computeSimilarEdges(image, [potentialEdge1, potentialEdge2]);

        expect(similarEdges.length).toBe(2);

        for (let similarEdge of similarEdges) {
            expect(similarEdge.data.direction).toBe(NavigationDirection.Similar);
        }

        for (let key of [potentialEdge1.id, potentialEdge2.id]) {
            let count: number = 0;

            for (let similarEdge of similarEdges) {
                if (similarEdge.target === key) {
                    count++;
                }
            }

            expect(count).toBe(1);
        }
    });

    it("should have only one similar edge for a sequence based on distance", () => {
        let potentialEdge1: PotentialEdge = helper.createPotentialEdge();
        let potentialEdge2: PotentialEdge = helper.createPotentialEdge();

        potentialEdge1.id = "k1";
        potentialEdge1.distance = 2;
        potentialEdge1.sameMergeCC = true;
        potentialEdge1.sequenceId = "s1";

        potentialEdge2.id = "k2";
        potentialEdge2.distance = 1;
        potentialEdge2.sameMergeCC = true;
        potentialEdge2.sequenceId = "s1";

        let similarEdges: NavigationEdge[] =
            edgeCalculator.computeSimilarEdges(image, [potentialEdge1, potentialEdge2]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: NavigationEdge = similarEdges[0];

        expect(similarEdge.target).toBe(potentialEdge2.id);
        expect(similarEdge.data.direction).toBe(NavigationDirection.Similar);
    });

    it("should have only one similar edge for a sequence based on rotation", () => {
        let potentialEdge1: PotentialEdge = helper.createPotentialEdge();
        let potentialEdge2: PotentialEdge = helper.createPotentialEdge();

        potentialEdge1.id = "k1";
        potentialEdge1.rotation = 2;
        potentialEdge1.sameMergeCC = true;
        potentialEdge1.sequenceId = "s1";

        potentialEdge2.id = "k2";
        potentialEdge2.rotation = 1;
        potentialEdge2.sameMergeCC = true;
        potentialEdge2.sequenceId = "s1";

        let similarEdges: NavigationEdge[] =
            edgeCalculator.computeSimilarEdges(image, [potentialEdge1, potentialEdge2]);

        expect(similarEdges.length).toBe(1);

        let similarEdge: NavigationEdge = similarEdges[0];

        expect(similarEdge.target).toBe(potentialEdge2.id);
        expect(similarEdge.data.direction).toBe(NavigationDirection.Similar);
    });
});
