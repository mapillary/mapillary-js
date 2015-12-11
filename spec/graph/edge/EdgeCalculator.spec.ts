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
    let epsilon: number = 1e-8;

    let edgeCalculator: EdgeCalculator;
    let spatial: Spatial;

    let latLon: ILatLon;

    let createSequence = (key: string, keys: string[]): Sequence => {
        let apiNavImS: IAPINavImS = { key: key, keys: keys };
        let sequence: Sequence = new Sequence(apiNavImS);

        return sequence;
    };

    let getTranslation = (r: number[], C: number[]): number[] => {
        let R: THREE.Matrix4 = spatial.rotationMatrix(r);
        let t: number[] = new THREE.Vector3().fromArray(C).applyMatrix4(R).multiplyScalar(-1).toArray();

        return t;
    };

    let createNode = (key: string, sequence: Sequence, r: number[], C: number[]): Node => {
        let t: number[] = getTranslation(r, C);

        let apiNavImIm: IAPINavImIm = { key: key, rotation: r, merge_version: 1, merge_cc: 2 };
        let node: Node = new Node(key, 0, latLon, true, sequence, apiNavImIm, t);

        return node;
    };

    let createRotationVector = (azimuth: number, norm: number = Math.PI / 2): number[] => {
        let x: number = Math.cos(azimuth);
        let y: number = Math.sin(azimuth);

        let r: number[] = [norm * x, norm * y, 0];

        return r;
    };

    beforeEach(() => {
        edgeCalculator = new EdgeCalculator();
        spatial = new Spatial();
    });

    beforeEach(() => {
        latLon = { lat: 0, lon: 0 };
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

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [0, -Math.PI / 2, 0], [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, [0, -Math.PI / 2, 0], [10, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBe(10);
        expect(potentialEdge.motionChange).toBe(0);
        expect(potentialEdge.verticalMotion).toBe(0);
        expect(potentialEdge.rotation).toBe(0);
        expect(potentialEdge.worldMotionAzimuth).toBe(0);
        expect(potentialEdge.directionChange).toBe(0);
        expect(potentialEdge.verticalDirectionChange).toBe(0);
        expect(potentialEdge.sameSequence).toBe(true);
        expect(potentialEdge.sameMergeCc).toBe(true);
    });

    it("should have correct distance", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [0, -Math.PI / 2, 0], [10, 10, 3])
        let edgeNode: Node = createNode(edgeKey, sequence, [0, -Math.PI / 2, 0], [13, 6, 3]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBe(5);
    });


    it("should have correct motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [0, -Math.PI / 2, 0], [-10, -10, -5])
        let edgeNode: Node = createNode(edgeKey, sequence, [0, -Math.PI / 2, 0], [-5, -5, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(Math.PI / 4, epsilon);
    });

    it("should have correct motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [Math.PI / 2, 0, 0], [10, -10, -5])
        let edgeNode: Node = createNode(edgeKey, sequence, [Math.PI / 2, 0, 0], [15, -5, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(-Math.PI / 4, epsilon);
    });

    it("should have correct motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [Math.PI / 2, 0, 0], [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, [Math.PI / 2, 0, 0], [0, -10, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.motionChange)).toBeCloseTo(Math.PI, epsilon);
    });

    it("should have correct vertical motion", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [Math.PI / 2, 0, 0], [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, [Math.PI / 2, 0, 0], [3, 4, 5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(Math.PI / 4, epsilon);
    });

    it("should have correct vertical motion", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, [Math.PI / 2, 0, 0], [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, [Math.PI / 2, 0, 0], [-3, -4, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(-Math.PI / 4, epsilon);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(Math.PI / 2), [-3, -4, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.directionChange).toBeCloseTo(Math.PI / 2, epsilon);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(-Math.PI / 2), [-3, 0, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.directionChange).toBeCloseTo(-Math.PI / 2, epsilon);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(Math.PI / 4), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(-3 * Math.PI / 4), [-3, 0, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.directionChange)).toBeCloseTo(Math.PI, epsilon);
    });

    it("should have correct vertical viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(Math.PI / 4), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(Math.PI / 4, Math.PI / 4), [-3, 0, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(Math.PI / 4, epsilon);
    });

    it("should have correct vertical viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(Math.PI / 4, 5 * Math.PI / 12), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(Math.PI / 4, 7 * Math.PI / 12), [-3, 0, -5]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(-Math.PI / 6, epsilon);
    });
});
