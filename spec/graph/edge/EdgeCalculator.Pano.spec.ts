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

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoMaxDistance / 2;
        potentialEdge1.fullPano = true;
    });

    it("should throw when node is not full", () => {
        node = helper.createCoreNode("", { alt: 0, lat: 0, lon: 0 }, "");

        expect(() => { edgeCalculator.computePanoEdges(node, []); }).toThrowError(Error);
    });

    it("should have a pano edge", () => {
        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should not have a pano edge for potential cropped pano ", () => {
        potentialEdge1.croppedPano = true;
        potentialEdge1.fullPano = false;
        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should have a pano edge irrespective of rotation", () => {
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should not have a pano edge with to long distance", () => {
        potentialEdge1.distance = settings.panoMaxDistance + 1;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not have a pano edge with to short distance", () => {
        potentialEdge1.distance = settings.panoMinDistance / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not have a pano edge for non full pano", () => {
        potentialEdge1.fullPano = false;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        for (let panoEdge of panoEdges) {
            expect(panoEdge.data.direction === EdgeDirection.Pano).toBe(false);
        }
    });

    it("should not have a pano edge when node is not full pano", () => {
        node = helper.createDefaultNode(false);

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoPreferredDistance;
        potentialEdge1.fullPano = true;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoPreferredDistance;
        potentialEdge2.fullPano = true;
    });

    it("should have a pano edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance + 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should have a pano edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance - 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should have a pano edge with same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should have a pano edge with same sequence", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should have a pano edge with smallest motion change", () => {
        potentialEdge1.motionChange = 0.2;
        potentialEdge2.motionChange = 0.1;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;

    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;
    let potentialEdge3: IPotentialEdge;
    let potentialEdge4: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoMaxDistance / 2;
        potentialEdge1.fullPano = true;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoMaxDistance / 2;
        potentialEdge2.fullPano = true;

        potentialEdge3 = helper.createPotentialEdge("pkey3");
        potentialEdge3.distance = settings.panoMaxDistance / 2;
        potentialEdge3.fullPano = true;

        potentialEdge4 = helper.createPotentialEdge("pkey4");
        potentialEdge4.distance = settings.panoMaxDistance / 2;
        potentialEdge4.fullPano = true;
    });

    it("should have only have one pano edge based on motion change", () => {
        potentialEdge1.motionChange = Math.PI / 4;
        potentialEdge2.motionChange = -Math.PI / 4;
        potentialEdge3.motionChange = Math.PI / 8;
        potentialEdge4.motionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge4.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should have a pano edge in four directions", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge2.motionChange = Math.PI / 2;
        potentialEdge3.motionChange = Math.PI;
        potentialEdge4.motionChange = -Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(panoEdges.length).toBe(4);

        let keys: string[] = [
            potentialEdge1.key,
            potentialEdge2.key,
            potentialEdge3.key,
            potentialEdge4.key,
        ];

        for (let key of keys) {
            let edge: IEdge = null;
            for (let panoEdge of panoEdges) {
                if (panoEdge.to === key) {
                    edge = panoEdge;
                }
            }

            expect(edge.data.direction).toBe(EdgeDirection.Pano);
        }
    });

    it("should not have multiple pano edges in same slice", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge2.motionChange = Math.PI / 36;
        potentialEdge3.motionChange = Math.PI;
        potentialEdge4.motionChange = -35 * Math.PI / 36;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(panoEdges.length).toBe(2);

        let keys: string[] = [
            potentialEdge1.key,
            potentialEdge3.key,
        ];

        for (let key of keys) {
            let edge: IEdge = null;
            for (let panoEdge of panoEdges) {
                if (panoEdge.to === key) {
                    edge = panoEdge;
                }
            }

            expect(edge.data.direction).toBe(EdgeDirection.Pano);
        }
    });

    it("should not have pano edges too close to each other on different slices", () => {
        potentialEdge1.motionChange = Math.PI / 6;
        potentialEdge2.motionChange = 2 * Math.PI / 6;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
        settings.panoMaxStepTurnChange = Math.PI / 8;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoPreferredDistance;
        potentialEdge1.fullPano = false;
    });

    it("should have a step forward edge", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should not have a step forward edge for potential cropped pano", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = 0;
        potentialEdge1.croppedPano = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should have a step left edge", () => {
        potentialEdge1.motionChange = Math.PI / 2;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepLeft);
    });

    it("should have a step left edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = -Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepLeft);
    });

    it("should have a step right edge", () => {
        potentialEdge1.motionChange = -Math.PI / 2;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepRight);
    });

    it("should have a step right edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepRight);
    });

    it("should have a step backward edge", () => {
        potentialEdge1.motionChange = Math.PI;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepBackward);
    });

    it("should have a step backward edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepBackward);
    });

    it("should have a step forward edge in opposite motion direction", () => {
        potentialEdge1.motionChange = Math.PI;
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge in perpendicular motion direction", () => {
        potentialEdge1.motionChange = Math.PI / 2;
        potentialEdge1.directionChange = Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should have a step forward edge in perpendicular motion direction", () => {
        potentialEdge1.motionChange = -Math.PI / 2;
        potentialEdge1.directionChange = -Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should not have a step forward edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = settings.panoMaxStepTurnChange + Math.PI / 18;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not have a step forward edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = -settings.panoMaxStepTurnChange - Math.PI / 18;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not have a step left edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2 + settings.panoMaxStepTurnChange + Math.PI / 18;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not have a step left edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2 - settings.panoMaxStepTurnChange - Math.PI / 18;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
        settings.panoMaxStepTurnChange = Math.PI / 8;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();

        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoPreferredDistance;
        potentialEdge1.fullPano = false;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoPreferredDistance;
        potentialEdge2.fullPano = false;
    });

    it("should prefer a step forward edge with preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance + 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should prefer a step forward edge with preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance - 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should prefer a step forward edge with smaller motion change", () => {
        potentialEdge1.motionChange = Math.PI / 18;
        potentialEdge2.motionChange = Math.PI / 36;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should prefer a step forward edge with smaller motion change", () => {
        potentialEdge1.motionChange = -Math.PI / 18;
        potentialEdge2.motionChange = -Math.PI / 36;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });

    it("should prefer a step forward edge with same merge connected component", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;

    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;
    let potentialEdge3: IPotentialEdge;
    let potentialEdge4: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoMaxDistance / 2;
        potentialEdge1.fullPano = false;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoMaxDistance / 2;
        potentialEdge2.fullPano = false;

        potentialEdge3 = helper.createPotentialEdge("pkey3");
        potentialEdge3.distance = settings.panoMaxDistance / 2;
        potentialEdge3.fullPano = false;

        potentialEdge4 = helper.createPotentialEdge("pkey4");
        potentialEdge4.distance = settings.panoMaxDistance / 2;
        potentialEdge4.fullPano = false;
    });

    it("should have a forward, left, backward and right pano edge at the same motion", () => {
        potentialEdge1.directionChange = 0;
        potentialEdge2.directionChange = -Math.PI / 2;
        potentialEdge3.directionChange = Math.PI;
        potentialEdge4.directionChange = Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(panoEdges.length).toBe(4);

        for (let panoEdge of panoEdges) {
            if (panoEdge.to === potentialEdge1.key) {
                expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
            } else if (panoEdge.to === potentialEdge2.key) {
                expect(panoEdge.data.direction).toBe(EdgeDirection.StepLeft);
            } else if (panoEdge.to === potentialEdge3.key) {
                expect(panoEdge.data.direction).toBe(EdgeDirection.StepBackward);
            } else if (panoEdge.to === potentialEdge4.key) {
                expect(panoEdge.data.direction).toBe(EdgeDirection.StepRight);
            }
        }
    });

    it("should not have any step edges in the pano edge direction", () => {
        potentialEdge1.fullPano = true;

        potentialEdge2.directionChange = 0;
        potentialEdge3.directionChange = Math.PI / 2;
        potentialEdge4.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3, potentialEdge4]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should not have a step left or right edge based on step forward edges", () => {
        potentialEdge1.directionChange = 0;
        potentialEdge1.motionChange = Math.PI / 18;

        potentialEdge2.directionChange = Math.PI / 4;
        potentialEdge2.motionChange = Math.PI / 4 + Math.PI / 36;

        potentialEdge3.directionChange = 3 * Math.PI / 4;
        potentialEdge3.motionChange = Math.PI / 4 + Math.PI / 36;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(
            node,
            [potentialEdge1, potentialEdge2, potentialEdge3]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.StepForward);
    });
});

describe("EdgeCalculator.computePerspectiveToPanoEdges", () => {
    let calculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let node: Node;
    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        settings = new EdgeCalculatorSettings();
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        calculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();
    });

    beforeEach(() => {
        node = helper.createDefaultNode();

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoMaxDistance / 2;
        potentialEdge1.fullPano = true;

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoMaxDistance / 2;
        potentialEdge2.fullPano = true;
    });

    it("should return a pano edge", () => {
        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should not return a pano edge for potential cropped pano", () => {
        potentialEdge1.croppedPano = true;
        potentialEdge1.fullPano = false;
        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not return a pano edge when node is pano", () => {
        node = helper.createDefaultNode(true);

        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should return only one pano edge", () => {
        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);
    });

    it("should return the pano edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance - 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should return the pano edge preferring forward motion", () => {
        potentialEdge1.motionChange = -Math.PI / 9;
        potentialEdge2.motionChange = Math.PI / 18;

        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });

    it("should return the pano edge preferring same connected component", () => {
        potentialEdge1.sameMergeCC = false;
        potentialEdge2.sameMergeCC = true;

        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.key);
        expect(panoEdge.data.direction).toBe(EdgeDirection.Pano);
    });
});
