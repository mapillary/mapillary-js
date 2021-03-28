import * as GeoCoords from "../../../src/geo/GeoCoords";
import { LngLatAlt } from "../../../src/api/interfaces/LngLatAlt";
import { Spatial } from "../../../src/geo/Spatial";
import { EdgeCalculator } from "../../../src/graph/edge/EdgeCalculator";
import { PotentialEdge }
    from "../../../src/graph/edge/interfaces/PotentialEdge";
import { Image } from "../../../src/graph/Image";
import { EdgeCalculatorHelper } from "../../helper/EdgeCalculatorHelper";

describe("EdgeCalculator.getPotentialEdges", () => {
    let precision: number = 7;
    let edgeCalculator: EdgeCalculator;
    let spatial: Spatial;
    let helper: EdgeCalculatorHelper;

    let createRotationVector: (azimuth: number, norm?: number) => number[] =
        (azimuth: number, norm: number = Math.PI / 2): number[] => {
            let x: number = Math.cos(azimuth);
            let y: number = Math.sin(azimuth);

            let r = [norm * x, norm * y, 0];

            return r;
        };

    beforeEach(() => {
        edgeCalculator = new EdgeCalculator();
        spatial = new Spatial();
        helper = new EdgeCalculatorHelper();
    });

    it("should throw when image is not full", () => {
        let image = helper.createCoreImage("", { alt: 0, lat: 0, lng: 0 }, "");

        expect(() => { edgeCalculator.getPotentialEdges(image, null, []); }).toThrowError(Error);
    });

    it("should return empty when image is not merged", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [0, -Math.PI / 2, 0],
                2,
                "perspective",
                0,
                0);

        let enu = [10, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(0);
    });

    it("should return a potential edge", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let enu = [10, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
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
        let key = "key";
        let sequenceKey = "skey";
        let edgeKey = "edgeKey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let enu = [10, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                null,
                [0, -Math.PI / 2, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);
    });

    it("should have correct distance", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let enu = [3, -4, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.distance).toBeCloseTo(5, precision);
    });

    it("should have correct positive motion change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let enu = [5, 5, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [0, -Math.PI / 2, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct negative motion change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let enu = [5, 5, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.motionChange).toBeCloseTo(-Math.PI / 4, precision);
    });

    it("should have correct backward motion change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let enu = [0, -10, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(Math.abs(potentialEdge.motionChange))
            .toBeCloseTo(Math.PI, precision);
    });

    it("should have correct positive vertical motion", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let enu = [3, 4, 5];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct negative vertical motion", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                [Math.PI / 2, 0, 0]);

        let enu = [-3, 4, -5];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey, edgeLla, sequenceKey, [Math.PI / 2, 0, 0]);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.verticalMotion).toBeCloseTo(-Math.PI / 4, precision);
    });

    it("should have correct viewing direction change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key, lla, sequenceKey, createRotationVector(0));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords.enuToGeodetic(
            enu[0],
            enu[1],
            enu[2],
            lla.lng,
            lla.lat,
            lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(Math.PI / 2));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.directionChange)
            .toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have correct viewing direction change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key, lla, sequenceKey, createRotationVector(0));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords.enuToGeodetic(
            enu[0],
            enu[1],
            enu[2],
            lla.lng,
            lla.lat,
            lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(-Math.PI / 2));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.directionChange)
            .toBeCloseTo(-Math.PI / 2, precision);
    });

    it("should have correct viewing direction change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key, lla, sequenceKey, createRotationVector(Math.PI / 4));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords.enuToGeodetic(
            enu[0],
            enu[1],
            enu[2],
            lla.lng,
            lla.lat,
            lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(-3 * Math.PI / 4));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(Math.abs(potentialEdge.directionChange))
            .toBeCloseTo(Math.PI, precision);
    });

    it("should have correct vertical viewing direction change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(Math.PI / 4));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(Math.PI / 4, Math.PI / 4));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange)
            .toBeCloseTo(Math.PI / 4, precision);
    });

    it("should have correct vertical viewing direction change", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(Math.PI / 4, 5 * Math.PI / 12));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage =
            helper.createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(Math.PI / 4, 7 * Math.PI / 12));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.verticalDirectionChange)
            .toBeCloseTo(-Math.PI / 6, precision);
    });

    it("should have correct rotation", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(Math.PI / 2, Math.PI / 6));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage =
            helper.createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(Math.PI / 2, 2 * Math.PI / 3));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.rotation)
            .toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have correct rotation", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let r1 = [1 / 3, 2 / 3, -1 / 3];
        let r2 = [-2 / 3, -1 / 4, 1 / 6];

        let theta: number = spatial.relativeRotationAngle(r1, r2);

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper.createSpatialImageEn(key, lla, sequenceKey, r1);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };
        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                r2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.rotation).toBeCloseTo(theta, precision);
    });

    it("should have 0 world motion azimuth", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let r1 = [0, 0, 0];
        let r2 = [0, 0, 0];

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                r1);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                r2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth)
            .toBeCloseTo(0, precision);
    });

    it("should have 90 degrees world motion azimuth", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let r1 = [0, 0, 0];
        let r2 = [0, 0, 0];

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper.createSpatialImageEn(key, lla, sequenceKey, r1);

        let enu = [0, 1, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth)
            .toBeCloseTo(Math.PI / 2, precision);
    });

    it("should have 180 degrees world motion azimuth", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let r1 = [0, 0, 0];
        let r2 = [0, 0, 0];

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper.createSpatialImageEn(key, lla, sequenceKey, r1);

        let enu = [-1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                r2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(Math.abs(potentialEdge.worldMotionAzimuth))
            .toBeCloseTo(Math.PI, precision);
    });

    it("should have minus 90 degrees world motion azimuth", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let r1 = [0, 0, 0];
        let r2 = [0, 0, 0];

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper.createSpatialImageEn(key, lla, sequenceKey, r1);

        let enu = [0, -1, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth)
            .toBeCloseTo(-Math.PI / 2, precision);
    });

    it("should have 45 degress world motion azimuth", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let r1 = [0, 0, 0];
        let r2 = [0, 0, 0];

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper.createSpatialImageEn(key, lla, sequenceKey, r1);

        let enu = [1, 1, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(edgeKey, edgeLla, sequenceKey, r2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.worldMotionAzimuth)
            .toBeCloseTo(Math.PI / 4, precision);
    });

    it("should be same sequence", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(0));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.sameSequence).toBe(true);
    });

    it("should not be same sequence", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";
        let edgeSequenceKey = "edgeSkey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0));

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                edgeSequenceKey,
                createRotationVector(0));

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.sameSequence).toBe(false);
    });

    it("should be same merge cc", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let mergeCC: number = 45;

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0),
                mergeCC);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(0),
                mergeCC);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(true);
    });

    it("should not be same merge cc", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let mergeCC1: number = 45;
        let mergeCC2: number = 22;

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0),
                mergeCC1);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(0),
                mergeCC2);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(false);
    });

    it("should be same merge cc when nonexistent", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0),
                null);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(0),
                null);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(true);
    });

    it("should not be same merge cc when one is nonexistent", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0),
                467);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(0),
                null);

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.sameMergeCC).toBe(false);
    });

    it("should be spherical when camera type spherical", () => {
        let key = "key";
        let edgeKey = "edgeKey";
        let sequenceKey = "skey";

        let lla: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        let image = helper
            .createSpatialImageEn(
                key,
                lla,
                sequenceKey,
                createRotationVector(0),
                467);

        let enu = [1, 0, 0];
        let geodetic = GeoCoords
            .enuToGeodetic(
                enu[0],
                enu[1],
                enu[2],
                lla.lng,
                lla.lat,
                lla.alt);

        let edgeLla: LngLatAlt = {
            alt: geodetic[2],
            lat: geodetic[1],
            lng: geodetic[0],
        };

        let edgeImage = helper
            .createSpatialImageEn(
                edgeKey,
                edgeLla,
                sequenceKey,
                createRotationVector(0),
                435,
                "spherical");

        let potentialEdges: PotentialEdge[] =
            edgeCalculator.getPotentialEdges(image, [edgeImage], []);

        expect(potentialEdges.length).toBe(1);

        let potentialEdge: PotentialEdge = potentialEdges[0];

        expect(potentialEdge.id).toBe(edgeKey);
        expect(potentialEdge.spherical).toBe(true);
    });
});
