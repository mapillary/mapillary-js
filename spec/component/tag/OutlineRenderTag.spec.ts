import * as THREE from "three";

import {
    OutlineTag,
    OutlineRenderTag,
    PolygonGeometry,
    RectGeometry,
} from "../../../src/Component";

import {TransformHelper} from "../../helper/TransformHelper.spec";

describe("OutlineRenderTag.ctor", () => {
    it("should be defined", () => {
        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const outlineTag: OutlineTag = new OutlineTag("id", geometry);
        const outlineRenderTag: OutlineRenderTag =
            new OutlineRenderTag(outlineTag, new TransformHelper().createTransform());

        expect(outlineRenderTag).toBeDefined();
    });
});

describe("OutlineRenderTag.getRetrievableObjects", () => {
    it("should return a mesh object irrespective of fill opacity", () => {
        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const outlineTag: OutlineTag = new OutlineTag("id", geometry, { fillOpacity: 1 });
        const outlineRenderTag: OutlineRenderTag =
            new OutlineRenderTag(outlineTag, new TransformHelper().createTransform());

        const retrievableObjects: THREE.Object3D[] = outlineRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(1);
        expect(retrievableObjects[0] instanceof THREE.Mesh).toBe(true);

        const outlineTagTransparent: OutlineTag = new OutlineTag("id", geometry, { fillOpacity: 0 });
        const outlineRenderTagTransparent: OutlineRenderTag =
            new OutlineRenderTag(outlineTagTransparent, new TransformHelper().createTransform());

        const retrievableTransparentObjects: THREE.Object3D[] = outlineRenderTagTransparent.getRetrievableObjects();

        expect(retrievableTransparentObjects.length).toBe(1);
        expect(retrievableTransparentObjects[0] instanceof THREE.Mesh).toBe(true);
    });

    it("should not return any objects for rects in panoramas", () => {
        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const outlineTag: OutlineTag = new OutlineTag("id", geometry, { fillOpacity: 1 });
        const outlineRenderTag: OutlineRenderTag =
            new OutlineRenderTag(outlineTag, new TransformHelper().createTransform({
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                 CroppedAreaLeftPixels: 0,
                 CroppedAreaTopPixels: 0,
                 FullPanoHeightPixels: 1,
                 FullPanoWidthPixels: 1,
            }));

        const retrievableObjects: THREE.Object3D[] = outlineRenderTag.getRetrievableObjects();

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
        const outlineTag: OutlineTag = new OutlineTag("id", geometry, { fillOpacity: 1 });
        const outlineRenderTag: OutlineRenderTag =
            new OutlineRenderTag(outlineTag, new TransformHelper().createTransform({
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                 CroppedAreaLeftPixels: 0,
                 CroppedAreaTopPixels: 0,
                 FullPanoHeightPixels: 1,
                 FullPanoWidthPixels: 1,
            }));

        const retrievableObjects: THREE.Object3D[] = outlineRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(1);
    });
});

describe("OutlineRenderTag.dispose", () => {
    it("should dispose all materials and geometries", () => {
        const geometry: PolygonGeometry =
            new PolygonGeometry(
                [[0, 0], [1, 0], [1, 1], [0, 0]],
                [[[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.1]]]);

        const outlineTag: OutlineTag = new OutlineTag("id", geometry, { fillOpacity: 1, lineOpacity: 1 });
        const outlineRenderTag: OutlineRenderTag =
            new OutlineRenderTag(outlineTag, new TransformHelper().createTransform());

        const glObjects: (THREE.Line | THREE.Mesh)[] = <(THREE.Line | THREE.Mesh)[]>outlineRenderTag.getGLObjects();

        const disposeSpies: jasmine.Spy[] = [];
        for (const glObject of glObjects) {
            disposeSpies.push(spyOn(<THREE.Geometry>glObject.geometry, "dispose").and.stub());
            disposeSpies.push(spyOn(<THREE.Material>glObject.material, "dispose").and.stub());
        }

        outlineRenderTag.dispose();

        for (const disposeSpy of disposeSpies) {
            expect(disposeSpy.calls.count()).toBe(1);
        }
    });
});
