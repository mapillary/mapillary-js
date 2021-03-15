import * as THREE from "three";
import { PolygonGeometry } from "../../../src/component/tag/geometry/PolygonGeometry";
import { RectGeometry } from "../../../src/component/tag/geometry/RectGeometry";
import { OutlineRenderTag } from "../../../src/component/tag/tag/OutlineRenderTag";
import { OutlineTag } from "../../../src/component/tag/tag/OutlineTag";
import { TransformHelper } from "../../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("OutlineRenderTag.ctor", () => {
    it("should be defined", () => {
        const geometry = new RectGeometry([0, 0, 1, 1]);
        const outlineTag = new OutlineTag("id", geometry);
        const outlineRenderTag =
            new OutlineRenderTag(outlineTag, transformHelper.createTransform());

        expect(outlineRenderTag).toBeDefined();
    });
});

describe("OutlineRenderTag.getRetrievableObjects", () => {
    it("should return a mesh object irrespective of fill opacity", () => {
        const geometry = new RectGeometry([0, 0, 1, 1]);
        const outlineTag = new OutlineTag("id", geometry, { fillOpacity: 1 });
        const outlineRenderTag =
            new OutlineRenderTag(outlineTag, transformHelper.createTransform());

        const retrievableObjects = outlineRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(1);
        expect(retrievableObjects[0] instanceof THREE.Mesh).toBe(true);

        const outlineTagTransparent = new OutlineTag("id", geometry, { fillOpacity: 0 });
        const outlineRenderTagTransparent =
            new OutlineRenderTag(outlineTagTransparent, transformHelper.createTransform());

        const retrievableTransparentObjects = outlineRenderTagTransparent.getRetrievableObjects();

        expect(retrievableTransparentObjects.length).toBe(1);
        expect(retrievableTransparentObjects[0] instanceof THREE.Mesh).toBe(true);
    });

    it("should not return any objects for rects in panoramas", () => {
        const geometry = new RectGeometry([0, 0, 1, 1]);
        const outlineTag = new OutlineTag("id", geometry, { fillOpacity: 1 });
        const outlineRenderTag =
            new OutlineRenderTag(
                outlineTag,
                transformHelper.createTransform(
                    "equirectangular"));

        const retrievableObjects = outlineRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(0);
    });

    it("should return mesh object for polygon in panoramas", () => {
        const geometry: PolygonGeometry = new PolygonGeometry([
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ]);
        const outlineTag = new OutlineTag("id", geometry, { fillOpacity: 1 });
        const outlineRenderTag =
            new OutlineRenderTag(
                outlineTag,
                transformHelper.createTransform(
                    "equirectangular"));

        const retrievableObjects = outlineRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(1);
    });
});

describe("OutlineRenderTag.dispose", () => {
    it("should dispose all materials and geometries", () => {
        const geometry: PolygonGeometry =
            new PolygonGeometry(
                [[0, 0], [1, 0], [1, 1], [0, 0]],
                [[[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.1]]]);

        const outlineTag = new OutlineTag("id", geometry, { fillOpacity: 1, lineOpacity: 1 });
        const outlineRenderTag =
            new OutlineRenderTag(outlineTag, transformHelper.createTransform());

        const glObjects: (THREE.Line | THREE.Mesh)[] = <(THREE.Line | THREE.Mesh)[]>outlineRenderTag.getGLObjects();

        const disposeSpies: jasmine.Spy[] = [];
        for (const glObject of glObjects) {
            disposeSpies.push(spyOn(<THREE.BufferGeometry>glObject.geometry, "dispose").and.stub());
            disposeSpies.push(spyOn(<THREE.Material>glObject.material, "dispose").and.stub());
        }

        outlineRenderTag.dispose();

        for (const disposeSpy of disposeSpies) {
            expect(disposeSpy.calls.count()).toBe(1);
        }
    });
});
