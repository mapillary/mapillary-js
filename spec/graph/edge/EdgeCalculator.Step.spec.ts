import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeDirection,
    IEdge,
    IPotentialEdge,
} from "../../../src/Edge";
import {Node} from "../../../src/Graph";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();

        directions = new EdgeCalculatorDirections();
        directions.steps[EdgeDirection.StepForward].useFallback = true;
        directions.steps[EdgeDirection.StepBackward].useFallback = false;

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode();

        potentialEdge = helper.createPotentialEdge();
        potentialEdge.distance = settings.stepMaxDistance / 2;
    });

    it("should throw when node is not full", () => {
        node = helper.createCoreNode("", { alt: 0, lat: 0, lon: 0 }, "");

        expect(() => { edgeCalculator.computeStepEdges(node, [], null, null); }).toThrowError(Error);
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = 0;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step left edge", () => {
        potentialEdge.motionChange = Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepLeft);
    });

    it("should have a step right edge", () => {
        potentialEdge.motionChange = -Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepRight);
    });

    it("should have a step back edge", () => {
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepBackward);
    });

    it("should not have any edges because potential is full pano", () => {
        potentialEdge.fullPano = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because potential is cropped pano", () => {
        potentialEdge.croppedPano = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of max distance", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of direction change", () => {
        potentialEdge.directionChange = settings.stepMaxDirectionChange + Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of negative direction change", () => {
        potentialEdge.directionChange = -settings.stepMaxDirectionChange - Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of drift", () => {
        potentialEdge.motionChange = settings.stepMaxDrift + Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of negative drift", () => {
        potentialEdge.motionChange = -settings.stepMaxDrift - Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should fallback to next node with enabled fallback setting", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;
        potentialEdge.motionChange = 0;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(
            node,
            [potentialEdge],
            potentialEdge.key,
            null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should not fallback to previous node with disabled fallback setting", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(
            node,
            [potentialEdge],
            null,
            potentialEdge.key);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges if node is full pano", () => {
        node = helper.createDefaultNode(true);

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges if node is cropped pano", () => {
        node = helper.createDefaultNode(true);
        node.gpano.CroppedAreaImageHeightPixels = 0.5;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode();

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge2 = helper.createPotentialEdge("pkey2");
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = settings.stepPreferredDistance + 1;
        potentialEdge2.distance = settings.stepPreferredDistance;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = settings.stepPreferredDistance - 1;
        potentialEdge2.distance = settings.stepPreferredDistance;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = settings.stepMaxDrift / 2;
        potentialEdge2.motionChange = settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = -settings.stepMaxDrift / 2;
        potentialEdge2.motionChange = -settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = settings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = -settings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = -settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge for smallest combined motion change", () => {
        potentialEdge1.motionChange = -settings.stepMaxDrift / 2;
        potentialEdge1.verticalMotion = -settings.stepMaxDrift / 4;

        potentialEdge2.motionChange = -settings.stepMaxDrift / 3;
        potentialEdge2.verticalMotion = -settings.stepMaxDrift / 3;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge with the same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge with the same merge cc", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge with smallest rotation", () => {
        potentialEdge1.rotation = 0.2;
        potentialEdge2.rotation = 0.1;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.StepForward);
    });
});
