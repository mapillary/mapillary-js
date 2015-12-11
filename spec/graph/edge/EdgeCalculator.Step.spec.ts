/// <reference path="../../../typings/jasmine/jasmine.d.ts" />

import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeConstants,
    IEdge,
    IPotentialEdge
} from "../../../src/Edge";
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let edgeCalculatorSettings: EdgeCalculatorSettings;
    let edgeCalculatorDirections: EdgeCalculatorDirections;

    let edgeCalculatorHelper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        edgeCalculatorSettings = new EdgeCalculatorSettings();

        edgeCalculatorDirections = new EdgeCalculatorDirections();
        edgeCalculatorDirections.steps[EdgeConstants.Direction.STEP_FORWARD].useFallback = true;
        edgeCalculatorDirections.steps[EdgeConstants.Direction.STEP_BACKWARD].useFallback = false;

        edgeCalculator = new EdgeCalculator(edgeCalculatorSettings, edgeCalculatorDirections);

        edgeCalculatorHelper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        potentialEdge = edgeCalculatorHelper.createPotentialEdge();
        potentialEdge.distance = edgeCalculatorSettings.stepMaxDistance / 2;
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = 0;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step left edge", () => {
        potentialEdge.motionChange = Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_LEFT);
    });

    it("should have a step right edge", () => {
        potentialEdge.motionChange = -Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_RIGHT);
    });

    it("should have a step back edge", () => {
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_BACKWARD);
    });

    it("should not have any edges because of max distance", () => {
        potentialEdge.distance = edgeCalculatorSettings.stepMaxDistance + 1;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of direction change", () => {
        potentialEdge.directionChange = edgeCalculatorSettings.stepMaxDirectionChange + Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of negative direction change", () => {
        potentialEdge.directionChange = -edgeCalculatorSettings.stepMaxDirectionChange - Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of drift", () => {
        potentialEdge.motionChange = edgeCalculatorSettings.stepMaxDrift + Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of negative drift", () => {
        potentialEdge.motionChange = -edgeCalculatorSettings.stepMaxDrift - Math.PI / 18;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should fallback to next node with enabled fallback setting", () => {
        potentialEdge.distance = edgeCalculatorSettings.stepMaxDistance + 1;
        potentialEdge.motionChange = 0;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(
            [potentialEdge], potentialEdge.apiNavImIm.key, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should not fallback to previous node with disabled fallback setting", () => {
        potentialEdge.distance = edgeCalculatorSettings.stepMaxDistance + 1;
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges(
            [potentialEdge], null, potentialEdge.apiNavImIm.key);

        expect(stepEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let edgeCalculatorSettings: EdgeCalculatorSettings;
    let edgeCalculatorDirections: EdgeCalculatorDirections;

    let edgeCalculatorHelper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        edgeCalculatorSettings = new EdgeCalculatorSettings();
        edgeCalculatorDirections = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(edgeCalculatorSettings, edgeCalculatorDirections);

        edgeCalculatorHelper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        potentialEdge1 = edgeCalculatorHelper.createPotentialEdge("pkey1");
        potentialEdge2 = edgeCalculatorHelper.createPotentialEdge("pkey2");
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = edgeCalculatorSettings.stepPreferredDistance + 1;
        potentialEdge2.distance = edgeCalculatorSettings.stepPreferredDistance;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = edgeCalculatorSettings.stepPreferredDistance - 1;
        potentialEdge2.distance = edgeCalculatorSettings.stepPreferredDistance;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = edgeCalculatorSettings.stepMaxDrift / 2;
        potentialEdge2.motionChange = edgeCalculatorSettings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = -edgeCalculatorSettings.stepMaxDrift / 2;
        potentialEdge2.motionChange = -edgeCalculatorSettings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = edgeCalculatorSettings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = edgeCalculatorSettings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = -edgeCalculatorSettings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = -edgeCalculatorSettings.stepMaxDrift / 4;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge for smallest combined motion change", () => {
        potentialEdge1.motionChange = -edgeCalculatorSettings.stepMaxDrift / 2;
        potentialEdge1.verticalMotion = -edgeCalculatorSettings.stepMaxDrift / 4;

        potentialEdge2.motionChange = -edgeCalculatorSettings.stepMaxDrift / 3;
        potentialEdge2.verticalMotion = -edgeCalculatorSettings.stepMaxDrift / 3;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge with the same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge with the same merge cc", () => {
        potentialEdge1.sameMergeCc = false;
        potentialEdge2.sameMergeCc = true;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge with smallest rotation", () => {
        potentialEdge1.rotation = 0.2;
        potentialEdge2.rotation = 0.1;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(stepEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });
});