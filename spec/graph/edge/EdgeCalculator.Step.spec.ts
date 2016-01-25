/// <reference path="../../../typings/jasmine/jasmine.d.ts" />

import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeDirection,
    IEdge,
    IPotentialEdge
} from "../../../src/Edge";
import {Node} from "../../../src/Graph";
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.computeStepEdges", () => {
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
        directions.steps[EdgeDirection.STEP_FORWARD].useFallback = true;
        directions.steps[EdgeDirection.STEP_BACKWARD].useFallback = false;

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode();

        potentialEdge = helper.createPotentialEdge();
        potentialEdge.distance = settings.stepMaxDistance / 2;
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = 0;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step left edge", () => {
        potentialEdge.motionChange = Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_LEFT);
    });

    it("should have a step right edge", () => {
        potentialEdge.motionChange = -Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_RIGHT);
    });

    it("should have a step back edge", () => {
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_BACKWARD);
    });

    it("should not have any edges because potential is pano", () => {
        potentialEdge.fullPano = true;

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

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node,
            [potentialEdge], potentialEdge.apiNavImIm.key, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should not fallback to previous node with disabled fallback setting", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node,
            [potentialEdge], null, potentialEdge.apiNavImIm.key);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges if node is pano", () => {
        node = helper.createNode(true);

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let node: Node;
    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode();

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge2 = helper.createPotentialEdge("pkey2");
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = settings.stepPreferredDistance + 1;
        potentialEdge2.distance = settings.stepPreferredDistance;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = settings.stepPreferredDistance - 1;
        potentialEdge2.distance = settings.stepPreferredDistance;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = settings.stepMaxDrift / 2;
        potentialEdge2.motionChange = settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = -settings.stepMaxDrift / 2;
        potentialEdge2.motionChange = -settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = settings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = -settings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = -settings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest combined motion change", () => {
        potentialEdge1.motionChange = -settings.stepMaxDrift / 2;
        potentialEdge1.verticalMotion = -settings.stepMaxDrift / 4;

        potentialEdge2.motionChange = -settings.stepMaxDrift / 3;
        potentialEdge2.verticalMotion = -settings.stepMaxDrift / 3;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge with the same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge with the same merge cc", () => {
        potentialEdge1.sameMergeCc = false;
        potentialEdge2.sameMergeCc = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });

    it("should have a step forward edge with smallest rotation", () => {
        potentialEdge1.rotation = 0.2;
        potentialEdge2.rotation = 0.1;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(node, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.data.direction).toBe(EdgeDirection.STEP_FORWARD);
    });
});