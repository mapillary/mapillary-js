/// <reference path="../../../typings/jasmine/jasmine.d.ts" />

import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeConstants,
    IEdge,
    IPotentialEdge
} from "../../../src/Edge";
import {Node} from "../../../src/Graph";
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

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

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoMaxDistance / 2;
        potentialEdge1.fullPano = true
    });

    it("should have a pano edge", () => {
        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should have a pano edge irrespective of rotation", () => {
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
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

        for (let i: number = 0; i < panoEdges.length; i++) {
            let panoEdge: IEdge = panoEdges[i];

            expect(panoEdge.direction === EdgeConstants.Direction.PANO).toBe(false);
        }
    });

    it("should not have a pano edge when node is not full pano", () => {
        node = helper.createNode(false);

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
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
        settings.panoMinDistance = 0.1;
        settings.panoMaxDistance = 20;
        settings.panoPreferredDistance = 5;
        settings.panoMaxItems = 4;
    });

    beforeEach(() => {
        directions = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(settings, directions);

        helper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoPreferredDistance;
        potentialEdge1.fullPano = true

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoPreferredDistance;
        potentialEdge2.fullPano = true
    });

    it("should have a pano edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance + 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should have a pano edge closest to preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance - 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should have a pano edge with same sequence", () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should have a pano edge with same sequence", () => {
        potentialEdge1.sameMergeCc = false;
        potentialEdge2.sameMergeCc = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should have a pano edge with smallest motion change", () => {
        potentialEdge1.motionChange = 0.2;
        potentialEdge2.motionChange = 0.1;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

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

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode(true);

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
            potentialEdge1.apiNavImIm.key,
            potentialEdge2.apiNavImIm.key,
            potentialEdge3.apiNavImIm.key,
            potentialEdge4.apiNavImIm.key
        ];

        for (let i: number = 0; i < keys.length; i++) {
            let key: string = keys[i];

            let edge: IEdge = null;
            for (let j: number = 0; j < panoEdges.length; j++) {
                let panoEdge: IEdge = panoEdges[j];

                if (panoEdge.to === key) {
                    edge = panoEdge;
                }
            }

            expect(edge.direction).toBe(EdgeConstants.Direction.PANO);
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
            potentialEdge1.apiNavImIm.key,
            potentialEdge3.apiNavImIm.key
        ];

        for (let i: number = 0; i < keys.length; i++) {
            let key: string = keys[i];

            let edge: IEdge = null;
            for (let j: number = 0; j < panoEdges.length; j++) {
                let panoEdge: IEdge = panoEdges[j];

                if (panoEdge.to === key) {
                    edge = panoEdge;
                }
            }

            expect(edge.direction).toBe(EdgeConstants.Direction.PANO);
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

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

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

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoPreferredDistance;
        potentialEdge1.fullPano = false
    });

    it("should have a step forward edge", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step left edge", () => {
        potentialEdge1.motionChange = Math.PI / 2;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_LEFT);
    });

    it("should have a step left edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = -Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_LEFT);
    });

    it("should have a step right edge", () => {
        potentialEdge1.motionChange = -Math.PI / 2;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_RIGHT);
    });

    it("should have a step right edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_RIGHT);
    });

    it("should have a step backward edge", () => {
        potentialEdge1.motionChange = Math.PI;
        potentialEdge1.directionChange = 0;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_BACKWARD);
    });

    it("should have a step backward edge for direction change", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_BACKWARD);
    });

    it("should have a step forward edge in opposite motion direction", () => {
        potentialEdge1.motionChange = Math.PI;
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge in perpendicular motion direction", () => {
        potentialEdge1.motionChange = Math.PI / 2;
        potentialEdge1.directionChange = Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should have a step forward edge in perpendicular motion direction", () => {
        potentialEdge1.motionChange = -Math.PI / 2;
        potentialEdge1.directionChange = -Math.PI / 2;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
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
        potentialEdge1.directionChange = Math.PI / 2 +settings.panoMaxStepTurnChange + Math.PI / 18;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });

    it("should not have a step left edge when turn is to large", () => {
        potentialEdge1.motionChange = 0;
        potentialEdge1.directionChange = Math.PI / 2 -settings.panoMaxStepTurnChange - Math.PI / 18;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1]);

        expect(panoEdges.length).toBe(0);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
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

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode(true);

        potentialEdge1 = helper.createPotentialEdge("pkey1");
        potentialEdge1.distance = settings.panoPreferredDistance;
        potentialEdge1.fullPano = false

        potentialEdge2 = helper.createPotentialEdge("pkey2");
        potentialEdge2.distance = settings.panoPreferredDistance;
        potentialEdge2.fullPano = false
    });

    it("should prefer a step forward edge with preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance + 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should prefer a step forward edge with preferred distance", () => {
        potentialEdge1.distance = settings.panoPreferredDistance - 1;
        potentialEdge2.distance = settings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should prefer a step forward edge with smaller motion change", () => {
        potentialEdge1.motionChange = Math.PI / 18;
        potentialEdge2.motionChange = Math.PI / 36;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should prefer a step forward edge with smaller motion change", () => {
        potentialEdge1.motionChange = -Math.PI / 18;
        potentialEdge2.motionChange = -Math.PI / 36;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });

    it("should prefer a step forward edge with same merge connected component", () => {
        potentialEdge1.sameMergeCc = false;
        potentialEdge2.sameMergeCc = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
    });
});

describe("EdgeCalculator.computePanoEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

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

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode(true);

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

        for (let i: number = 0; i < panoEdges.length; i++) {
            let panoEdge: IEdge = panoEdges[i];

            if (panoEdge.to === potentialEdge1.apiNavImIm.key) {
                expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_FORWARD);
            } else if (panoEdge.to === potentialEdge2.apiNavImIm.key) {
                expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_LEFT);
            } else if (panoEdge.to === potentialEdge3.apiNavImIm.key) {
                expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_BACKWARD);
            } else if (panoEdge.to === potentialEdge4.apiNavImIm.key) {
                expect(panoEdge.direction).toBe(EdgeConstants.Direction.STEP_RIGHT);
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

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });
});

describe("EdgeCalculator.computePerspectiveToPanoEdges", () => {
    let calculator: EdgeCalculator;
    let settings: EdgeCalculatorSettings;
    let directions: EdgeCalculatorDirections;

    let helper: EdgeCalculatorHelper;

    let spatial: Spatial;

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

        spatial = new Spatial();
    });

    beforeEach(() => {
        node = helper.createNode();

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

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should not return a pano edge when node is pano", () => {
        node = helper.createNode(true);

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

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should return the pano edge preferring forward motion", () => {
        potentialEdge1.motionChange = -Math.PI / 9;
        potentialEdge2.motionChange = Math.PI / 18;

        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it("should return the pano edge preferring same connected component", () => {
        potentialEdge1.sameMergeCc = false;
        potentialEdge2.sameMergeCc = true;

        let panoEdges: IEdge[] = calculator.computePerspectiveToPanoEdges(node, [potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });
});
