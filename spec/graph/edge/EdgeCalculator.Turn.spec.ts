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

describe("EdgeCalculator.computeTurnEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode();

        potentialEdge = helper.createPotentialEdge();
        potentialEdge.distance = settings.turnMaxDistance / 2;
    });

    it("should throw when node is not full", () => {
        node = helper.createCoreNode("", { alt: 0, lat: 0, lon: 0 }, "");

        expect(() => { edgeCalculator.computeTurnEdges(node, []); }).toThrowError(Error);
    });

    it("should not have any edges because potential is full pano", () => {
        potentialEdge.directionChange = Math.PI / 2;
        potentialEdge.fullPano = true;

        let stepEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(stepEdges.length).toBe(0);
    });

    it("should not have any edges because potential is cropped pano", () => {
        potentialEdge.directionChange = Math.PI / 2;
        potentialEdge.croppedPano = true;

        let stepEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(stepEdges.length).toBe(0);
    });

    it("should have a turn left edge", () => {
        potentialEdge.directionChange = Math.PI / 2;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnLeft);
    });

    it("should have a turn right edge", () => {
        potentialEdge.directionChange = -Math.PI / 2;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnRight);
    });

    it("should have a u-turn edge", () => {
        potentialEdge.directionChange = Math.PI;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnU);
    });

    it("should not have a u-turn edge when node is full pano", () => {
        node = helper.createDefaultNode(true);

        potentialEdge.directionChange = Math.PI;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(turnEdges.length).toBe(0);
    });

    it("should not have a u-turn edge when node is cropped pano", () => {
        node = helper.createDefaultNode(true);
        node.gpano.CroppedAreaImageHeightPixels = 0.5;

        potentialEdge.directionChange = Math.PI;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge]);

        expect(turnEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeTurnEdges", () => {
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
        potentialEdge1.distance = settings.turnMaxRigDistance * 2;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.turnMaxRigDistance * 2;
    });

    it("should have a turn left with the same sequence", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.sameSequence = false;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.sameSequence = true;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnLeft);
    });

    it("should have a turn left with the same merge cc", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.sameMergeCC = false;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.sameMergeCC = true;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnLeft);
    });

    it("should have a turn left edge with the smallest distance", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.distance = 5;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.distance = 3;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnLeft);
    });

    it("should have a turn left edge with the smallest motion difference", () => {
        let motionChange: number =
            directions.turns[EdgeDirection.TurnLeft].motionChange;

        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.motionChange = 0.9 * motionChange;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.motionChange = motionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnLeft);
    });

    it("should have a turn left edge for rig setup with smallest direction change", () => {
        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = 1.2 * settings.turnMinRigDirectionChange;

        potentialEdge2.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge2.directionChange = 1.1 * settings.turnMinRigDirectionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnLeft);
    });

    it("should have a turn right edge for rig setup with smallest direction change", () => {
        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = -1.2 * settings.turnMinRigDirectionChange;

        potentialEdge2.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge2.directionChange = -1.1 * settings.turnMinRigDirectionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.key);
        expect(turnEdge.data.direction).toBe(EdgeDirection.TurnRight);
    });

    it("should not have a turn left edge for rig with too small angle", () => {
        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = 0.9 * settings.turnMinRigDirectionChange;

        potentialEdge1.distance = 0.5 * settings.turnMaxRigDistance;
        potentialEdge1.directionChange = -0.9 * settings.turnMinRigDirectionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges(node, [potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(0);
    });
});
