import {IGPano} from "../../../src/API";
import {EdgeCalculator, IPotentialEdge} from "../../../src/Edge";
import {GeoCoords, ILatLonAlt, Spatial} from "../../../src/Geo";
import {Node} from "../../../src/Graph";
import {EdgeCalculatorHelper} from "../../helper/EdgeCalculatorHelper.spec";

describe("EdgeCalculator.getPotentialEdges", () => {
    let precision: number = 7;

    let edgeCalculator: EdgeCalculator;
    let spatial: Spatial;
    let geoCoords: GeoCoords;

    let helper: EdgeCalculatorHelper;

    let createRotationVector: (azimuth: number, norm?: number) => number[] =
        (azimuth: number, norm: number = Math.PI / 2): number[] => {
            let x: number = Math.cos(azimuth);
            let y: number = Math.sin(azimuth);

            let r: number[] = [norm * x, norm * y, 0];

            return r;
        };

    beforeEach(() => {
        edgeCalculator = new EdgeCalculator();
        spatial = new Spatial();
        geoCoords = new GeoCoords();

        helper = new EdgeCalculatorHelper();
    });

    it("should throw when node is not full", () => {
        let node: Node = helper.createCoreNode("", { alt: 0, lat: 0, lon: 0 }, "");

        expect(() => { edgeCalculator.getPotentialEdges(node, null, []); }).toThrowError(Error);
    });

    it("should return empty when node is not merged", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [0, -Math.PI / 2, 0], 2, null, 0, 0);

        let enu: number[] = [10, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(0);
    });

    it("should return a potential edge", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [0, -Math.PI / 2, 0]);

        let enu: number[] = [10, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBeCloseTo(10, precision);
        expect(potentialEdge.motionChange).toBeCloseTo(0, precision);
        expect(potentialEdge.verticalMotion).toBeCloseTo(0, precision);
        expect(potentialEdge.rotation).toBeCloseTo(0, precision);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(0, precision);
        expect(potentialEdge.directionChange).toBeCloseTo(0, precision);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(0, precision);
        expect(potentialEdge.sameSequence).toBe(true);
        expect(potentialEdge.sameMergeCC).toBe(true);
    });

    it("should handle potential edge without sequence", () => {
        let key: string = "key";
        let sequenceKey: string = "skey";
        let edgeKey: string = "edgeKey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [0, -Math.PI / 2, 0]);

        let enu: number[] = [10, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, null, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);
    });

    it("should have correct distance", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [0, -Math.PI / 2, 0]);

        let enu: number[] = [3, -4, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.distance).toBeCloseTo(5, precision);
    });

    it("should have correct positive motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [0, -Math.PI / 2, 0]);

        let enu: number[] = [5, 5, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [0, -Math.PI / 2, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct negative motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [Math.PI / 2, 0, 0]);

        let enu: number[] = [5, 5, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(-Math.PI / 4, precision);
    });

    it("should have correct backward motion change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [Math.PI / 2, 0, 0]);

        let enu: number[] = [0, -10, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.motionChange)).toBeCloseTo(Math.PI, precision);
    });

    it("should have correct positive vertical motion", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [Math.PI / 2, 0, 0]);

        let enu: number[] = [3, 4, 5];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct negative vertical motion", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, [Math.PI / 2, 0, 0]);

        let enu: number[] = [-3, 4, -5];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, [Math.PI / 2, 0, 0]);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(-Math.PI / 4, precision);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(Math.PI / 2));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.directionChange).toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(-Math.PI / 2));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.directionChange).toBeCloseTo(-Math.PI / 2, precision);
    });

    it("should have correct viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(Math.PI / 4));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(-3 * Math.PI / 4));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.directionChange)).toBeCloseTo(Math.PI, precision);
    });

    it("should have correct vertical viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(Math.PI / 4));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(Math.PI / 4, Math.PI / 4));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct vertical viewing direction change", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(Math.PI / 4, 5 * Math.PI / 12));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(Math.PI / 4, 7 * Math.PI / 12));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange).toBeCloseTo(-Math.PI / 6, precision);
    });

    it("should have correct rotation", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(Math.PI / 2, Math.PI / 6));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(Math.PI / 2, 2 * Math.PI / 3));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have correct rotation", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let r1: number[] = [1 / 3, 2 / 3, -1 / 3];
        let r2: number[] = [-2 / 3, -1 / 4, 1 / 6];

        let theta: number = spatial.relativeRotationAngle(r1, r2);

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, r1);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(theta, precision);
    });

    it("should have 0 world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, r1);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(0, precision);
    });

    it("should have 90 degrees world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, r1);

        let enu: number[] = [0, 1, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have 180 degrees world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, r1);

        let enu: number[] = [-1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(Math.abs(potentialEdge.worldMotionAzimuth)).toBeCloseTo(Math.PI, precision);
    });

    it("should have minus 90 degrees world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, r1);

        let enu: number[] = [0, -1, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(-Math.PI / 2, precision);
    });

    it("should have 45 degress world motion azimuth", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let r1: number[] = [0, 0, 0];
        let r2: number[] = [0, 0, 0];

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, r1);

        let enu: number[] = [1, 1, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should be same sequence", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(0));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.sameSequence).toBe(true);
    });

    it("should not be same sequence", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";
        let edgeSequenceKey: string = "edgeSkey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0));

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, edgeSequenceKey, createRotationVector(0));

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.sameSequence).toBe(false);
    });

    it("should be same merge cc", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let mergeCC: number = 45;

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0), mergeCC);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(0), mergeCC);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(true);
    });

    it("should not be same merge cc", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let mergeCC1: number = 45;
        let mergeCC2: number = 22;

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0), mergeCC1);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(0), mergeCC2);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(false);
    });

    it("should be same merge cc when nonexistent", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0), null);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(0), null);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(true);
    });

    it("should not be same merge cc when one is nonexistent", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0), 467);

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(0), null);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(false);
    });

    it("should be full pano when gpano existing and correct", () => {
        let key: string = "key";
        let edgeKey: string = "edgeKey";
        let sequenceKey: string = "skey";

        let lla: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let node: Node = helper.createFullNode(key, lla, sequenceKey, createRotationVector(0), 467);

        let gpano: IGPano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        let enu: number[] = [1, 0, 0];
        let geodetic: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], lla.lat, lla.lon, lla.alt);
        let edgeLla: ILatLonAlt = { alt: geodetic[2], lat: geodetic[0], lon: geodetic[1] };
        let edgeNode: Node = helper.createFullNode(edgeKey, edgeLla, sequenceKey, createRotationVector(0), 435, gpano);

        let potentialEdges: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, [edgeNode], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: IPotentialEdge = potentialEdges[0];

        expect(potentialEdge.key).toBe(edgeKey);
        expect(potentialEdge.fullPano).toBe(true);
    });
});
