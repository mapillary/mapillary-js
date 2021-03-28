import { EdgeCalculator } from "../../../src/graph/edge/EdgeCalculator";
import { EdgeCalculatorDirections } from "../../../src/graph/edge/EdgeCalculatorDirections";
import { EdgeCalculatorSettings } from "../../../src/graph/edge/EdgeCalculatorSettings";
import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";
import { NavigationEdge } from "../../../src/graph/edge/interfaces/NavigationEdge";
import { PotentialEdge } from "../../../src/graph/edge/interfaces/PotentialEdge";
import { Image } from "../../../src/graph/Image";
import { EdgeCalculatorHelper } from "../../helper/EdgeCalculatorHelper";

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let image: Image;
    let potentialEdge: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();

        directions = new EdgeCalculatorDirections();
        directions.steps[NavigationDirection.StepForward].useFallback = true;
        directions.steps[NavigationDirection.StepBackward].useFallback = false;

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        image = helper.createDefaultImage();

        potentialEdge = helper.createPotentialEdge();
        potentialEdge.distance = settings.stepMaxDistance / 2;
    });

    it("should throw when image is not full", () => {
        image = helper.createCoreImage("", { alt: 0, lat: 0, lng: 0 }, "");

        expect(() => { edgeCalculator.computeStepEdges(image, [], null, null); }).toThrowError(Error);
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = 0;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step left edge", () => {
        potentialEdge.motionChange = Math.PI / 2;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepLeft);
    });

    it("should have a step right edge", () => {
        potentialEdge.motionChange = -Math.PI / 2;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepRight);
    });

    it("should have a step back edge", () => {
        potentialEdge.motionChange = Math.PI;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepBackward);
    });

    it("should not have any edges because potential is spherical", () => {
        potentialEdge.spherical = true;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of max distance", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of direction change", () => {
        potentialEdge.directionChange = settings.stepMaxDirectionChange + Math.PI / 18;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of negative direction change", () => {
        potentialEdge.directionChange = -settings.stepMaxDirectionChange - Math.PI / 18;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of drift", () => {
        potentialEdge.motionChange = settings.stepMaxDrift + Math.PI / 18;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because of negative drift", () => {
        potentialEdge.motionChange = -settings.stepMaxDrift - Math.PI / 18;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });

    it("should fallback to next image with enabled fallback setting", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;
        potentialEdge.motionChange = 0;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(
            image,
            [potentialEdge],
            potentialEdge.id,
            null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should not fallback to previous image with disabled fallback setting", () => {
        potentialEdge.distance = settings.stepMaxDistance + 1;
        potentialEdge.motionChange = Math.PI;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(
            image,
            [potentialEdge],
            null,
            potentialEdge.id);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges if image is spherical", () => {
        image = helper.createDefaultImage(true);

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge], null, null);

        expect(stepEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeStepEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let image: Image;
    let potentialEdge1: PotentialEdge;
    let potentialEdge2: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        image = helper.createDefaultImage();

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge2 = helper.createPotentialEdge("pkey2");
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = settings.stepPreferredDistance + 1;
        potentialEdge2.distance = settings.stepPreferredDistance;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge based on preferred distance", () => {
        potentialEdge1.distance = settings.stepPreferredDistance - 1;
        potentialEdge2.distance = settings.stepPreferredDistance;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = settings.stepMaxDrift / 2;
        potentialEdge2.motionChange = settings.stepMaxDrift / 4;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge for smallest motion change", () => {
        potentialEdge1.motionChange = -settings.stepMaxDrift / 2;
        potentialEdge2.motionChange = -settings.stepMaxDrift / 4;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = settings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = settings.stepMaxDrift / 4;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge for smallest vertical motion change", () => {
        potentialEdge1.verticalMotion = -settings.stepMaxDrift / 2;
        potentialEdge2.verticalMotion = -settings.stepMaxDrift / 4;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge for smallest combined motion change", () => {
        potentialEdge1.motionChange = -settings.stepMaxDrift / 2;
        potentialEdge1.verticalMotion = -settings.stepMaxDrift / 4;

        potentialEdge2.motionChange = -settings.stepMaxDrift / 3;
        potentialEdge2.verticalMotion = -settings.stepMaxDrift / 3;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge with the same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge with the same merge cc", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge with smallest rotation", () => {
        potentialEdge1.rotation = 0.2;
        potentialEdge2.rotation = 0.1;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeStepEdges(image, [potentialEdge1, potentialEdge2], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: NavigationEdge = stepEdges[0];

        expect(stepEdge.target).toBe(potentialEdge2.id);
        expect(stepEdge.data.direction).toBe(NavigationDirection.StepForward);
    });
});
