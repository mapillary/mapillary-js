/// <reference path="../../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Node, Sequence, Graph} from "../../../src/Graph";
import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    EdgeConstants,
    IEdge,
    IPotentialEdge
} from "../../../src/Edge";
import {IAPINavIm, IAPINavImIm, IAPINavImS} from "../../../src/API";
import {ILatLon} from "../../../src/Viewer"
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator", () => {
    var graph: Graph;

    beforeEach(() => {
        graph = new Graph()
    });

    it("should create an edgeCalculator", () => {
        expect(graph.edgeCalculator).toBeDefined();
    });

    it("should create the simplest sequence graph", () => {
        var key1 = "key1";
        var key2 = "key2";
        var key3 = "key3";
        var skey1 = "skey1";

        var data: IAPINavIm = {
            hs: [],
            ims: [
                { key: key1 },
                { key: key2 },
                { key: key3 }
            ],
            ss: [
                { key: skey1, keys: [key1, key2, key3] }
            ]
        };

        graph.insertNodes(data);
        let edges: any = graph.edgeCalculator.calculateEdges(graph.node(key2));

        let nextEdges = edges[EdgeConstants.Direction.NEXT];
        let prevEdges = edges[EdgeConstants.Direction.PREV];

        expect(prevEdges.length).toBe(1);
        expect(nextEdges.length).toBe(1);

        expect(prevEdges[0]).toBe(key1);
        expect(nextEdges[0]).toBe(key3);
    });
});

describe("EdgeCalculator.getPotentialEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let spatial: Spatial;

    beforeEach(() => {
        edgeCalculator = new EdgeCalculator();
        spatial = new Spatial();
    });

    it("should return empty array when node is not worthy", () => {
        let node: Node = new Node("key", 0, null, false, null, null, null);

        let result: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, null, []);

        expect(result.length).toBe(0);
    });

    it("should return a potential edge", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let apiNavImS: IAPINavImS = { key: "skey", keys: [key, edgeKey] };
        let sequence: Sequence = new Sequence(apiNavImS);

        let latLon: ILatLon = { lat: 0, lon: 0 };

        let r: number[] = [0, -Math.PI / 2, 0];
        let R: THREE.Matrix4 = spatial.rotationMatrix(r);
        let apiNavImIm: IAPINavImIm = { key: key, rotation: r, merge_version: 1, merge_cc: 2 };

        let C: number[] = [0, 0, 0];
        let t: number[] = new THREE.Vector3().fromArray(C).applyMatrix4(R).multiplyScalar(-1).toArray();

        let node: Node = new Node(key, 0, latLon, true, sequence, apiNavImIm, t);

        let apiNavImImE: IAPINavImIm = { key: edgeKey, rotation: r, merge_version: 1, merge_cc: 2 };

        let Ce: number[] = [10, 0, 0];
        let te: number[] = new THREE.Vector3().fromArray(Ce).applyMatrix4(R).multiplyScalar(-1).toArray();

        let edgeNode: Node = new Node("edgeKey", 0, latLon, true, sequence, apiNavImImE, te);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBe(10);
        expect(potentialEdge.motionChange).toBe(0);
        expect(potentialEdge.verticalMotion).toBe(0);
        expect(potentialEdge.rotation).toBe(0);
        expect(potentialEdge.directionChange).toBe(0);
        expect(potentialEdge.verticalDirectionChange).toBe(0);
        expect(potentialEdge.sameSequence).toBe(true);
        expect(potentialEdge.sameMergeCc).toBe(true);
    });
});

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

describe("EdgeCalculator.computeTurnEdges", () => {
    let edgeCalculator: EdgeCalculator;
    let edgeCalculatorSettings: EdgeCalculatorSettings;
    let edgeCalculatorDirections: EdgeCalculatorDirections;

    let edgeCalculatorHelper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        edgeCalculatorSettings = new EdgeCalculatorSettings();
        edgeCalculatorDirections = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(edgeCalculatorSettings, edgeCalculatorDirections);

        edgeCalculatorHelper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
       potentialEdge = edgeCalculatorHelper.createPotentialEdge();
       potentialEdge.distance = edgeCalculatorSettings.turnMaxDistance / 2;
    });

    it("should have a turn left edge", () => {
        potentialEdge.directionChange = Math.PI / 2;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_LEFT);
    });

    it("should have a turn right edge", () => {
        potentialEdge.directionChange = -Math.PI / 2;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_RIGHT);
    });

    it("should have a u-turn edge", () => {
        potentialEdge.directionChange = Math.PI;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_U);
    });
});

describe("EdgeCalculator.computeTurnEdges", () => {
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
       potentialEdge1.distance = edgeCalculatorSettings.turnMaxRigDistance * 2;

       potentialEdge2 = edgeCalculatorHelper.createPotentialEdge("pkey2");
       potentialEdge2.distance = edgeCalculatorSettings.turnMaxRigDistance * 2;
    });

    it("should have a turn left with the same sequence", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.sameSequence = false;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.sameSequence = true;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_LEFT);
    });

    it("should have a turn left with the same merge cc", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.sameMergeCc = false;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.sameMergeCc = true;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_LEFT);
    });

    it("should have a turn left edge with the smallest distance", () => {
        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.distance = 5;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.distance = 3;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_LEFT);
    });

    it("should have a turn left edge with the smallest motion difference", () => {
        let motionChange: number =
            edgeCalculatorDirections.turns[EdgeConstants.Direction.TURN_LEFT].motionChange;

        potentialEdge1.directionChange = Math.PI / 2;
        potentialEdge1.motionChange = 0.9 * motionChange;

        potentialEdge2.directionChange = Math.PI / 2;
        potentialEdge2.motionChange = motionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_LEFT);
    });

    it("should have a turn left edge for rig setup with smallest direction change", () => {
        potentialEdge1.distance = 0.5 * edgeCalculatorSettings.turnMaxRigDistance;
        potentialEdge1.directionChange = 1.2 * edgeCalculatorSettings.turnMinRigDirectionChange;

        potentialEdge2.distance = 0.5 * edgeCalculatorSettings.turnMaxRigDistance;
        potentialEdge2.directionChange = 1.1 * edgeCalculatorSettings.turnMinRigDirectionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_LEFT);
    });

    it("should have a turn right edge for rig setup with smallest direction change", () => {
        potentialEdge1.distance = 0.5 * edgeCalculatorSettings.turnMaxRigDistance;
        potentialEdge1.directionChange = -1.2 * edgeCalculatorSettings.turnMinRigDirectionChange;

        potentialEdge2.distance = 0.5 * edgeCalculatorSettings.turnMaxRigDistance;
        potentialEdge2.directionChange = -1.1 * edgeCalculatorSettings.turnMinRigDirectionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(1);

        let turnEdge: IEdge = turnEdges[0];

        expect(turnEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(turnEdge.direction).toBe(EdgeConstants.Direction.TURN_RIGHT);
    });

    it("should not have a turn left edge for rig with too small angle", () => {
        potentialEdge1.distance = 0.5 * edgeCalculatorSettings.turnMaxRigDistance;
        potentialEdge1.directionChange = 0.9 * edgeCalculatorSettings.turnMinRigDirectionChange;

        potentialEdge1.distance = 0.5 * edgeCalculatorSettings.turnMaxRigDistance;
        potentialEdge1.directionChange = -0.9 * edgeCalculatorSettings.turnMinRigDirectionChange;

        let turnEdges: IEdge[] = edgeCalculator.computeTurnEdges([potentialEdge1, potentialEdge2]);

        expect(turnEdges.length).toBe(0);
    });
});

describe('EdgeCalculator.computePanoEdges', () => {
    let edgeCalculator: EdgeCalculator;
    let edgeCalculatorSettings: EdgeCalculatorSettings;
    let edgeCalculatorDirections: EdgeCalculatorDirections;

    let edgeCalculatorHelper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let potentialEdge1: IPotentialEdge;

    beforeEach(() => {
        edgeCalculatorSettings = new EdgeCalculatorSettings();
        edgeCalculatorSettings.panoMinDistance = 0.1;
        edgeCalculatorSettings.panoMaxDistance = 20;
        edgeCalculatorSettings.panoPreferredDistance = 5;
        edgeCalculatorSettings.panoMaxItems = 4;
    });

    beforeEach(() => {
        edgeCalculatorDirections = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(edgeCalculatorSettings, edgeCalculatorDirections);

        edgeCalculatorHelper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        potentialEdge1 = edgeCalculatorHelper.createPotentialEdge("pkey1");
        potentialEdge1.distance = edgeCalculatorSettings.panoMaxDistance / 2;
        potentialEdge1.fullPano = true
    });

    it('should have a pano edge', () => {
        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it('should have a pano edge irrespective of rotation', () => {
        potentialEdge1.directionChange = Math.PI;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge1.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });
});

describe('EdgeCalculator.computePanoEdges', () => {
    let edgeCalculator: EdgeCalculator;
    let edgeCalculatorSettings: EdgeCalculatorSettings;
    let edgeCalculatorDirections: EdgeCalculatorDirections;

    let edgeCalculatorHelper: EdgeCalculatorHelper;

    let spatial: Spatial;

    let potentialEdge1: IPotentialEdge;
    let potentialEdge2: IPotentialEdge;

    beforeEach(() => {
        edgeCalculatorSettings = new EdgeCalculatorSettings();
        edgeCalculatorSettings.panoMinDistance = 0.1;
        edgeCalculatorSettings.panoMaxDistance = 20;
        edgeCalculatorSettings.panoPreferredDistance = 5;
        edgeCalculatorSettings.panoMaxItems = 4;
    });

    beforeEach(() => {
        edgeCalculatorDirections = new EdgeCalculatorDirections();
        edgeCalculator = new EdgeCalculator(edgeCalculatorSettings, edgeCalculatorDirections);

        edgeCalculatorHelper = new EdgeCalculatorHelper();

        spatial = new Spatial();
    });

    beforeEach(() => {
        potentialEdge1 = edgeCalculatorHelper.createPotentialEdge("pkey1");
        potentialEdge1.distance = edgeCalculatorSettings.panoPreferredDistance;
        potentialEdge1.fullPano = true

        potentialEdge2 = edgeCalculatorHelper.createPotentialEdge("pkey2");
        potentialEdge2.distance = edgeCalculatorSettings.panoPreferredDistance;
        potentialEdge2.fullPano = true
    });

    it('should have a pano edge closest to preferred distance', () => {
        potentialEdge1.distance = edgeCalculatorSettings.panoPreferredDistance + 1;
        potentialEdge2.distance = edgeCalculatorSettings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it('should have a pano edge closest to preferred distance', () => {
        potentialEdge1.distance = edgeCalculatorSettings.panoPreferredDistance - 1;
        potentialEdge2.distance = edgeCalculatorSettings.panoPreferredDistance;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it('should have a pano edge with same sequence', () => {
        potentialEdge1.sameSequence = false;
        potentialEdge2.sameSequence = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it('should have a pano edge with same sequence', () => {
        potentialEdge1.sameMergeCc = false;
        potentialEdge2.sameMergeCc = true;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });

    it('should have a pano edge with smallest motion change', () => {
        potentialEdge1.motionChange = 0.2;
        potentialEdge2.motionChange = 0.1;

        let panoEdges: IEdge[] = edgeCalculator.computePanoEdges([potentialEdge1, potentialEdge2]);

        expect(panoEdges.length).toBe(1);

        let panoEdge: IEdge = panoEdges[0];

        expect(panoEdge.to).toBe(potentialEdge2.apiNavImIm.key);
        expect(panoEdge.direction).toBe(EdgeConstants.Direction.PANO);
    });
});
