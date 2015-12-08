/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {EdgeCalculator, IPotentialEdge, IEdge, Node, Sequence, Graph, GraphConstants} from "../../src/Graph";
import {IAPINavIm, IAPINavImIm, IAPINavImS} from "../../src/API";
import {ILatLon} from "../../src/Viewer"
import {Spatial} from "../../src/Geo";

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

        let nextEdges = edges[GraphConstants.Direction.NEXT];
        let prevEdges = edges[GraphConstants.Direction.PREV];

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

describe("EdgeCalculator.computeStepNodes", () => {
    let edgeCalculator: EdgeCalculator;
    let spatial: Spatial;

    let potentialEdge: IPotentialEdge;

    beforeEach(() => {
        edgeCalculator = new EdgeCalculator();
        spatial = new Spatial();
    });

    beforeEach(() => {
       potentialEdge = {
            distance: 10,
            motionChange: 0,
            verticalMotion: 0,
            directionChange: 0,
            verticalDirectionChange: 0,
            rotation: 0,
            sameSequence: false,
            sameMergeCc: false,
            apiNavImIm: { key: "pkey" }
        }
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = 0;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(GraphConstants.Direction.STEP_FORWARD);
    });

    it("should have a step left edge", () => {
        potentialEdge.motionChange = Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(GraphConstants.Direction.STEP_LEFT);
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = -Math.PI / 2;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(GraphConstants.Direction.STEP_RIGHT);
    });

    it("should have a step forward edge", () => {
        potentialEdge.motionChange = Math.PI;

        let stepEdges: IEdge[] = edgeCalculator.computeStepEdges([potentialEdge], null, null);

        expect(stepEdges.length).toBe(1);

        let stepEdge: IEdge = stepEdges[0];

        expect(stepEdge.to).toBe(potentialEdge.apiNavImIm.key);
        expect(stepEdge.direction).toBe(GraphConstants.Direction.STEP_BACKWARD);
    });
});
