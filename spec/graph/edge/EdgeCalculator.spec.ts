/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {Node, Sequence} from "../../../src/Graph";
import {
    EdgeCalculator,
    EdgeCalculatorSettings,
    EdgeCalculatorDirections,
    IEdge,
    IPotentialEdge
} from "../../../src/Edge";
import {IAPINavImIm, IAPINavImS} from "../../../src/API";
import {GeoCoords, ILatLon, ILatLonAlt, Spatial} from "../../../src/Geo";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.getPotentialEdges", () => {
    let precision: number = 7;

    let edgeCalculator: EdgeCalculator;
    let spatial: Spatial;
    let geoCoords: GeoCoords;

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
        latLonAlt: ILatLonAlt,
        sequence: Sequence,
        r: number[],
        merge_cc: number = 2,
        apiNavImIm: IAPINavImIm = null): Node => {

        apiNavImIm = apiNavImIm == null ?
            {
                key: key,
                rotation: r,
                merge_version: 1,
                merge_cc: merge_cc,
                calt: latLonAlt.alt,
                clat: latLonAlt.lat,
                clon: latLonAlt.lon,
            } :
            apiNavImIm;

        return new Node(0, latLonAlt, true, sequence, apiNavImIm, []);
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
        geoCoords = new GeoCoords();
    });

    beforeEach(() => {
        latLon = { lat: 0, lon: 0 };
    });

    it("should return empty array when node is not worthy", () => {
        let node: Node = new Node(0, null, false, null, { key: "" }, null);

        let result: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, null, []);

        expect(result.length).toBe(0);
    });

    it("should return a potential edge", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [0, -Math.PI / 2, 0]);

        let enu: number[] = [10, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBeCloseTo(10, precision);
        expect(potentialEdge.motionChange).toBeCloseTo(0, precision);
        expect(potentialEdge.verticalMotion).toBeCloseTo(0, precision);
        expect(potentialEdge.rotation).toBeCloseTo(0, precision);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(0, precision);
        expect(potentialEdge.directionChange).toBeCloseTo(0, precision);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(0, precision);
        expect(potentialEdge.sameSequence).toBe(true);
        expect(potentialEdge.sameMergeCc).toBe(true);
    });

    it("should have correct distance", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [0, -Math.PI / 2, 0]);

        let enu: number[] = [3, -4, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBeCloseTo(5, precision);
    });


    it("should have correct positive motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [0, -Math.PI / 2, 0]);

        let enu: number[] = [5, 5, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct negative motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [Math.PI / 2, 0, 0]);

        let enu: number[] = [5, 5, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(-Math.PI / 4, precision);
    });

    it("should have correct backward motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [Math.PI / 2, 0, 0]);

        let enu: number[] = [0, -10, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.motionChange)).toBeCloseTo(Math.PI, precision);
    });

    it("should have correct positive vertical motion", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [Math.PI / 2, 0, 0]);

        let enu: number[] = [3, 4, 5];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct negative vertical motion", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, [Math.PI / 2, 0, 0]);

        let enu: number[] = [-3, 4, -5];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(-Math.PI / 4, precision);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(Math.PI / 2));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.directionChange).toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(-Math.PI / 2));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.directionChange).toBeCloseTo(-Math.PI / 2, precision);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(Math.PI / 4));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(-3 * Math.PI / 4));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.directionChange)).toBeCloseTo(Math.PI, precision);
    });

    it("should have correct vertical viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(Math.PI / 4));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(Math.PI / 4, Math.PI / 4));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct vertical viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(Math.PI / 4, 5 * Math.PI / 12));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(Math.PI / 4, 7 * Math.PI / 12));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(-Math.PI / 6, precision);
    });

    it("should have correct rotation", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(Math.PI / 2, Math.PI / 6));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(Math.PI / 2, 2 * Math.PI / 3));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have correct rotation", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [1/3, 2/3, -1/3];
        let r2: number[] = [-2/3, -1/4, 1/6];

        let theta: number = spatial.relativeRotationAngle(r1, r2);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, r1)

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(theta, precision);
    });

    it("should have 0 world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, r1);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(0, precision);
    });

    it("should have 90 degrees world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, r1);

        let enu: number[] = [0, 1, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have 180 degrees world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, r1);

        let enu: number[] = [-1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.worldMotionAzimuth)).toBeCloseTo(Math.PI, precision);
    });

    it("should have minus 90 degrees world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, r1);

        let enu: number[] = [0, -1, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(-Math.PI / 2, precision);
    });

    it("should have 45 degress world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, r1);

        let enu: number[] = [1, 1, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should be same sequence", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";

        let sequence: Sequence = createSequence("skey", [key, edgeKey]);

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(0));

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

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence1, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence2, createRotationVector(0));

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

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0), mergeCc);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(0), mergeCc);

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

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0), mergeCc1);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(0), mergeCc2);

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

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0), null);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(0), null);

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

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0), 467);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(0), null);

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

        let lla: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };
        let node: Node = createNode(key, lla, sequence, createRotationVector(0), 467);

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

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { lat: geodetic[0], lon: geodetic[1], alt: geodetic[2] };
        let edgeNode: Node = createNode(edgeKey, edgeLla, sequence, createRotationVector(0), 435, apiNavImIm);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.apiNavImIm.key).toBe(edgeKey);
        expect(potentialEdge.fullPano).toBe(true);
    });
});
