/// <reference path="../../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Node, Sequence, ILatLon} from "../../../src/Graph";
import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    IEdge,
    IPotentialEdge
} from "../../../src/Edge";
import {IAPINavImIm, IAPINavImS} from "../../../src/API";
import {Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

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

    let createNode = (
        key: string,
        sequence: Sequence,
        r: number[],
        C: number[],
        merge_cc: number = 2,
        apiNavImIm: IAPINavImIm = null): Node => {
        let t: number[] = getTranslation(r, C);

        apiNavImIm = apiNavImIm == null ?
            { key: key, rotation: r, merge_version: 1, merge_cc: merge_cc } :
            apiNavImIm;
        let node: Node = new Node(key, 0, latLon, true, sequence, apiNavImIm, t, []);

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
        let node: Node = new Node("key", 0, null, false, null, null, null, null);

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

    it("should have correct rotation", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(Math.PI / 2, Math.PI / 6), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(Math.PI / 2, 2 * Math.PI / 3), [-3, 0, 2]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(Math.PI / 2, epsilon);
    });

    it("should have correct rotation", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [1/3, 2/3, -1/3];
        let r2: number[] = [-2/3, -1/4, 1/6];

        let theta: number = spatial.relativeRotationAngle(r1, r2);

        let node: Node = createNode(key, sequence, r1, [0, 2, -1])
        let edgeNode: Node = createNode(edgeKey, sequence, r2, [-3, 0, 2]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(theta, epsilon);
    });

    it("should have 0 world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let node: Node = createNode(key, sequence, r1, [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, r2, [1, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(0, epsilon);
    });

    it("should have 90 degress world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let node: Node = createNode(key, sequence, r1, [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, r2, [0, 1, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(Math.PI / 2, epsilon);
    });

    it("should have 180 degress world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let node: Node = createNode(key, sequence, r1, [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, r2, [-1, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.worldMotionAzimuth)).toBeCloseTo(Math.PI, epsilon);
    });

    it("should have minus 90 degress world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let node: Node = createNode(key, sequence, r1, [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, r2, [0, -1, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(-Math.PI / 2, epsilon);
    });

    it("should have 45 degress world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let node: Node = createNode(key, sequence, r1, [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, r2, [1, 1, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(Math.PI / 4, epsilon);
    });

    it("should be same sequence", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(0), [0, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.sameSequence).toBe(true);
    });

    it("should not be same sequence", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence1: Sequence = createSequence("skey1", [key, edgeKey]);
        let sequence2: Sequence = createSequence("skey2", [key, edgeKey]);

        let node: Node = createNode(key, sequence1, createRotationVector(0), [0, 0, 0])
        let edgeNode: Node = createNode(edgeKey, sequence2, createRotationVector(0), [0, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.sameSequence).toBe(false);
    });

    it("should be same merge cc", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey1", [key, edgeKey]);

        let mergeCc: number = 45;

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0], mergeCc)
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(0), [0, 0, 0], mergeCc);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCc).toBe(true);
    });

    it("should not be same merge cc", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey1", [key, edgeKey]);

        let mergeCc1: number = 45;
        let mergeCc2: number = 22;

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0], mergeCc1)
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(0), [0, 0, 0], mergeCc2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCc).toBe(false);
    });

    it("should be same merge cc when nonexistent", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey1", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0], null)
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(0), [0, 0, 0], null);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCc).toBe(true);
    });

    it("should not be same merge cc when one is nonexistent", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey1", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0], 467);
        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(0), [0, 0, 0], null);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCc).toBe(false);
    });

    it("should be full pano when gpano existing and correct", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey1", [key, edgeKey]);

        let node: Node = createNode(key, sequence, createRotationVector(0), [0, 0, 0], 467);

        let apiNavImIm: IAPINavImIm = {
            key: edgeKey,
            rotation: [0, 0, 0],
            merge_version: 1,
            merge_cc: 435,
            gpano: {
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaImageHeightPixels: 1,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        }

        let edgeNode: Node = createNode(edgeKey, sequence, createRotationVector(0), [0, 0, 0], 435, apiNavImIm);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.fullPano).toBe(true);
    });
});
