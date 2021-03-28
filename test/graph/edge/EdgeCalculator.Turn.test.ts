import { EdgeCalculator } from "../../../src/graph/edge/EdgeCalculator";
import { EdgeCalculatorDirections } from "../../../src/graph/edge/EdgeCalculatorDirections";
import { EdgeCalculatorSettings } from "../../../src/graph/edge/EdgeCalculatorSettings";
import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";
import { NavigationEdge } from "../../../src/graph/edge/interfaces/NavigationEdge";
import { PotentialEdge } from "../../../src/graph/edge/interfaces/PotentialEdge";
import { Image } from "../../../src/graph/Image";
import { EdgeCalculatorHelper } from "../../helper/EdgeCalculatorHelper";

describe("EdgeCalculator.computeTurnEdges", () => {
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

    beforeEach(() => {
        image = helper.createDefaultImage();

        potentialEdge = helper.createPotentialEdge();
        potentialEdge.distance = settings.turnMaxDistance / 2;
    });

    it("should throw when image is not full", () => {
        image = helper.createCoreImage("", { alt: 0, lat: 0, lng: 0 }, "");

        expect(() => { edgeCalculator.computeTurnEdges(image, []); }).toThrowError(Error);
    });

    it("should not have any edges because potential is spherical", () => {
        potentialEdge.directionChange = Math.PI / 2;
        potentialEdge.spherical = true;

        let stepEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge]);

        expect(stepEdges.length).toBe(0);
    });

    it("should have a turn left edge", () => {
        potentialEdge.directionChange = Math.PI / 2;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnLeft);
    });

    it("should have a turn right edge", () => {
        potentialEdge.directionChange = -Math.PI / 2;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnRight);
    });

    it("should have a u-turn edge", () => {
        potentialEdge.directionChange = Math.PI;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnU);
    });

    it("should not have a u-turn edge when image is spherical", () => {
        image = helper.createDefaultImage(true);

        potentialEdge.directionChange = Math.PI;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge]);

        expect(turnEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeTurnEdges", () => {
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
        potentialEdge1.distance = settings.turnMaxRigDistance * 2;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.turnMaxRigDistance * 2;
    });

    it("should have a turn left with the same sequence", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.sameSequence = false;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.sameSequence = true;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge2.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnLeft);
    });

    it("should have a turn left with the same merge cc", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.sameMergeCC = false;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.sameMergeCC = true;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge2.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnLeft);
    });

    it("should have a turn left edge with the smallest distance", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.distance = 5;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.distance = 3;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge2.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnLeft);
    });

    it("should have a turn left edge with the smallest motion difference", () => {
        let motionChange: number =
            directions.turns[NavigationDirection.TurnLeft].motionChange;

        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.motionChange = 0.9 * motionChange;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.motionChange = motionChange;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge2.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnLeft);
    });

    it("should have a turn left edge for rig setup with smallest direction change", () => {
        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = 1.2 * settings.turnMinRigDirectionChange;

        potentialEdge2.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge2.directionChange = 1.1 * settings.turnMinRigDirectionChange;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge2.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnLeft);
    });

    it("should have a turn right edge for rig setup with smallest direction change", () => {
        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = -1.2 * settings.turnMinRigDirectionChange;

        potentialEdge2.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge2.directionChange = -1.1 * settings.turnMinRigDirectionChange;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: NavigationEdge = turnEdges[0];

        expect(turnEdge.target).toBe(potentialEdge2.id);
        expect(turnEdge.data.direction).toBe(NavigationDirection.TurnRight);
    });

    it("should not have a turn left edge for rig with too small angle", () => {
        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = 0.9 * settings.turnMinRigDirectionChange;

        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = -0.9 * settings.turnMinRigDirectionChange;

        let turnEdges: NavigationEdge[] = edgeCalculator.computeTurnEdges(image, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(0);
    });
});
