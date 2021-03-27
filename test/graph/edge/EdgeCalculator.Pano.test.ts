import { Node } from "../../../src/graph/Node";
import { EdgeCalculator } from "../../../src/graph/edge/EdgeCalculator";
import { EdgeCalculatorDirections } from "../../../src/graph/edge/EdgeCalculatorDirections";
import { EdgeCalculatorSettings } from "../../../src/graph/edge/EdgeCalculatorSettings";
import { PotentialEdge } from "../../../src/graph/edge/interfaces/PotentialEdge";
import { EdgeCalculatorHelper } from "../../helper/EdgeCalculatorHelper";
import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";

describe("EdgeCalculator.computeSphericalEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalMaxDistance / 2;
        potentialEdge1.spherical = true;
    });

    it("should throw when node is not full", () => {
        node = helper.createCoreNode("", { alt: 0, lat: 0, lon: 0 }, "");

        expect(() => { edgeCalculator.computeSphericalEdges(node, []); }).toThrowError(Error);
    });

    it("should have a spherical edge", () => {
        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should have a spherical edge irrespective of rotation", () => {
        potentialEdge1.directionChange = Math.PI;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should not have a spherical edge with to long distance", () => {
        potentialEdge1.distance = settings.sphericalMaxDistance + 1;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });

    it("should not have a spherical edge with to short distance", () => {
        potentialEdge1.distance = settings.sphericalMinDistance / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });

    it("should not have a spherical edge for non spherical", () => {
        potentialEdge1.spherical = false;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        for (let sphericalEdge of sphericalEdges) {
            expect(sphericalEdge.data.direction === NavigationDirection.Spherical).toBe(false);
        }
    });

    it("should not have a spherical edge when node is not spherical", () => {
        node = helper.createDefaultNode(false);

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeSphericalEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: PotentialEdge;
    let potentialEdge2: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalPreferredDistance;
        potentialEdge1.spherical = true;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.sphericalPreferredDistance;
        potentialEdge2.spherical = true;
    });

    it("should have a spherical edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.sphericalPreferredDistance + 1;
        potentialEdge2.distance = settings.sphericalPreferredDistance;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should have a spherical edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.sphericalPreferredDistance - 1;
        potentialEdge2.distance = settings.sphericalPreferredDistance;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should have a spherical edge with same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should have a spherical edge with same sequence", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should have a spherical edge with smallest motion change", () => {
        potentialEdge1.motionChange = 0.2;
        potentialEdge2.motionChange = 0.1;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });
});

describe("EdgeCalculator.computeSphericalEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;

    let potentialEdge1: PotentialEdge;
    let potentialEdge2: PotentialEdge;
    let potentialEdge3: PotentialEdge;
    let potentialEdge4: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalMaxDistance / 2;
        potentialEdge1.spherical = true;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.sphericalMaxDistance / 2;
        potentialEdge2.spherical = true;

        potentialEdge3 = helper.createPotentialEdge("pkey3");
        potentialEdge3.distance = settings.sphericalMaxDistance / 2;
        potentialEdge3.spherical = true;

        potentialEdge4 = helper.createPotentialEdge("pkey4");
        potentialEdge4.distance = settings.sphericalMaxDistance / 2;
        potentialEdge4.spherical = true;
    });

    it("should have only have one spherical edge based on motion change", () => {
        potentialEdge1.motionChange = Math.PI / 4;
        potentialEdge2.motionChange = -Math.PI / 4;
        potentialEdge3.motionChange = Math.PI / 8;
        potentialEdge4.motionChange = 0;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge4.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should have a spherical edge in four directions", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge2.motionChange = Math.PI / 2;
        potentialEdge3.motionChange = Math.PI;
        potentialEdge4.motionChange = -Math.PI / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(sphericalEdges.length).toBe(4);

        let keys: string[] = [
            potentialEdge1.id,
            potentialEdge2.id,
            potentialEdge3.id,
            potentialEdge4.id,
        ];

        for (let key of keys) {
            let edge = null;
            for (let sphericalEdge of sphericalEdges) {
                if (sphericalEdge.target === key) {
                    edge = sphericalEdge;
                }
            }

            expect(edge.data.direction).toBe(NavigationDirection.Spherical);
        }
    });

    it("should not have multiple spherical edges in same slice", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge2.motionChange = Math.PI / 36;
        potentialEdge3.motionChange = Math.PI;
        potentialEdge4.motionChange = -35 * Math.PI / 36;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(sphericalEdges.length).toBe(2);

        let keys: string[] = [
            potentialEdge1.id,
            potentialEdge3.id,
        ];

        for (let key of keys) {
            let edge = null;
            for (let sphericalEdge of sphericalEdges) {
                if (sphericalEdge.target === key) {
                    edge = sphericalEdge;
                }
            }

            expect(edge.data.direction).toBe(NavigationDirection.Spherical);
        }
    });

    it("should not have spherical edges too close to each other on different slices", () => {
        potentialEdge1.motionChange = Math.PI / 6;
        potentialEdge2.motionChange = 2 * Math.PI / 6;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });
});

describe("EdgeCalculator.computeSphericalEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
        settings.sphericalMaxStepTurnChange = Math.PI / 8;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalPreferredDistance;
        potentialEdge1.spherical = false;
    });

    it("should have a step forward edge", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = 0;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step left edge", () => {
        potentialEdge1.motionChange = Math.PI / 2;
        potentialEdge1.directionChange = 0;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepLeft);
    });

    it("should have a step left edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = -Math.PI / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepLeft);
    });

    it("should have a step right edge", () => {
        potentialEdge1.motionChange = -Math.PI / 2;
        potentialEdge1.directionChange = 0;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepRight);
    });

    it("should have a step right edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepRight);
    });

    it("should have a step backward edge", () => {
        potentialEdge1.motionChange = Math.PI;
        potentialEdge1.directionChange = 0;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepBackward);
    });

    it("should have a step backward edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepBackward);
    });

    it("should have a step forward edge in opposite motion direction", () => {
        potentialEdge1.motionChange = Math.PI;
        potentialEdge1.directionChange = Math.PI;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge in perpendicular motion direction", () => {
        potentialEdge1.motionChange = Math.PI / 2;
        potentialEdge1.directionChange = Math.PI / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should have a step forward edge in perpendicular motion direction", () => {
        potentialEdge1.motionChange = -Math.PI / 2;
        potentialEdge1.directionChange = -Math.PI / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should not have a step forward edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = settings.sphericalMaxStepTurnChange + Math.PI / 18;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });

    it("should not have a step forward edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = -settings.sphericalMaxStepTurnChange - Math.PI / 18;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });

    it("should not have a step left edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2 + settings.sphericalMaxStepTurnChange + Math.PI / 18;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });

    it("should not have a step left edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2 - settings.sphericalMaxStepTurnChange - Math.PI / 18;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computeSphericalEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: PotentialEdge;
    let potentialEdge2: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
        settings.sphericalMaxStepTurnChange = Math.PI / 8;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalPreferredDistance;
        potentialEdge1.spherical = false;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.sphericalPreferredDistance;
        potentialEdge2.spherical = false;
    });

    it("should prefer a step forward edge with preferred distance", () => {
        potentialEdge1.distance = settings.sphericalPreferredDistance + 1;
        potentialEdge2.distance = settings.sphericalPreferredDistance;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should prefer a step forward edge with preferred distance", () => {
        potentialEdge1.distance = settings.sphericalPreferredDistance - 1;
        potentialEdge2.distance = settings.sphericalPreferredDistance;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should prefer a step forward edge with smaller motion change", () => {
        potentialEdge1.motionChange = Math.PI / 18;
        potentialEdge2.motionChange = Math.PI / 36;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should prefer a step forward edge with smaller motion change", () => {
        potentialEdge1.motionChange = -Math.PI / 18;
        potentialEdge2.motionChange = -Math.PI / 36;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });

    it("should prefer a step forward edge with same merge connected component", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });
});

describe("EdgeCalculator.computeSphericalEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;

    let potentialEdge1: PotentialEdge;
    let potentialEdge2: PotentialEdge;
    let potentialEdge3: PotentialEdge;
    let potentialEdge4: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalMaxDistance / 2;
        potentialEdge1.spherical = false;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.sphericalMaxDistance / 2;
        potentialEdge2.spherical = false;

        potentialEdge3 = helper.createPotentialEdge("pkey3");
        potentialEdge3.distance = settings.sphericalMaxDistance / 2;
        potentialEdge3.spherical = false;

        potentialEdge4 = helper.createPotentialEdge("pkey4");
        potentialEdge4.distance = settings.sphericalMaxDistance / 2;
        potentialEdge4.spherical = false;
    });

    it("should have a forward, left, backward and right spherical edge at the same motion", () => {
        potentialEdge1.directionChange = 0;
        potentialEdge2.directionChange = -Math.PI / 2;
        potentialEdge3.directionChange = Math.PI;
        potentialEdge4.directionChange = Math.PI / 2;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(sphericalEdges.length).toBe(4);

        for (let sphericalEdge of sphericalEdges) {
            if (sphericalEdge.target === potentialEdge1.id) {
                expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
            } else if (sphericalEdge.target === potentialEdge2.id) {
                expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepLeft);
            } else if (sphericalEdge.target === potentialEdge3.id) {
                expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepBackward);
            } else if (sphericalEdge.target === potentialEdge4.id) {
                expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepRight);
            }
        }
    });

    it("should not have any step edges in the spherical edge direction", () => {
        potentialEdge1.spherical = true;

        potentialEdge2.directionChange = 0;
        potentialEdge3.directionChange = Math.PI / 2;
        potentialEdge4.directionChange = Math.PI;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should not have a step left or right edge based on step forward edges", () => {
        potentialEdge1.directionChange = 0;
        potentialEdge1.motionChange = Math.PI / 18;

        potentialEdge2.directionChange = Math.PI / 4;
        potentialEdge2.motionChange = Math.PI / 4 + Math.PI / 36;

        potentialEdge3.directionChange = 3 * Math.PI / 4;
        potentialEdge3.motionChange = Math.PI / 4 + Math.PI / 36;

        let sphericalEdges = edgeCalculator.computeSphericalEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.StepForward);
    });
});

describe("EdgeCalculator.computePerspectiveToSphericalEdges", () => {
    let calculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: PotentialEdge;
    let potentialEdge2: PotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.sphericalMinDistance = 0.1;
        settings.sphericalMaxDistance = 20;
        settings.sphericalPreferredDistance = 5;
        settings.sphericalMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        calculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode();

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.sphericalMaxDistance / 2;
        potentialEdge1.spherical = true;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.sphericalMaxDistance / 2;
        potentialEdge2.spherical = true;
    });

    it("should return a spherical edge", () => {
        let sphericalEdges = calculator.computePerspectiveToSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge1.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should not return a spherical edge when node is spherical", () => {
        node = helper.createDefaultNode(true);

        let sphericalEdges = calculator.computePerspectiveToSphericalEdges(node, [potentialEdge1]);

        expect(sphericalEdges.length).toBe(0);
    });

    it("should return only one spherical edge", () => {
        let sphericalEdges = calculator.computePerspectiveToSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);
    });

    it("should return the spherical edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.sphericalPreferredDistance - 1;
        potentialEdge2.distance = settings.sphericalPreferredDistance;

        let sphericalEdges = calculator.computePerspectiveToSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should return the spherical edge preferring forward motion", () => {
        potentialEdge1.motionChange = -Math.PI / 9;
        potentialEdge2.motionChange = Math.PI / 18;

        let sphericalEdges = calculator.computePerspectiveToSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });

    it("should return the spherical edge preferring same connected component", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let sphericalEdges = calculator.computePerspectiveToSphericalEdges(node, [potentialEdge1, potentialEdge2]);

        expect(sphericalEdges.length).toBe(1);

        let sphericalEdge = sphericalEdges[0];

        expect(sphericalEdge.target).toBe(potentialEdge2.id);
        expect(sphericalEdge.data.direction).toBe(NavigationDirection.Spherical);
    });
});
