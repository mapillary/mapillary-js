import * as THREE from "three";

import {
    ExtremePointTag,
    ExtremePointRenderTag,
    PointsGeometry,
} from "../../../src/Component";

import {TransformHelper} from "../../helper/TransformHelper.spec";

describe("ExtremePointRenderTag.ctor", () => {
    it("should be defined", () => {
        const geometry: PointsGeometry = new PointsGeometry([[0, 0], [1, 1]]);
        const extremePointTag: ExtremePointTag = new ExtremePointTag("id", geometry);
        const extremePointRenderTag: ExtremePointRenderTag =
            new ExtremePointRenderTag(extremePointTag, new TransformHelper().createTransform());

        expect(extremePointRenderTag).toBeDefined();
    });
});

describe("ExtremePointRenderTag.getRetrievableObjects", () => {
    it("should return a mesh object irrespective of fill opacity", () => {
        const geometry: PointsGeometry = new PointsGeometry([[0, 0], [1, 1]]);
        const extremePointTag: ExtremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 1 });
        const extremePointRenderTag: ExtremePointRenderTag =
            new ExtremePointRenderTag(extremePointTag, new TransformHelper().createTransform());

        const retrievableObjects: THREE.Object3D[] = extremePointRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(1);
        expect(retrievableObjects[0] instanceof THREE.Mesh).toBe(true);

        const extremePointTagTransparent: ExtremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 0 });
        const extremePointRenderTagTransparent: ExtremePointRenderTag =
            new ExtremePointRenderTag(extremePointTagTransparent, new TransformHelper().createTransform());

        const retrievableTransparentObjects: THREE.Object3D[] = extremePointRenderTagTransparent.getRetrievableObjects();

        expect(retrievableTransparentObjects.length).toBe(1);
        expect(retrievableTransparentObjects[0] instanceof THREE.Mesh).toBe(true);
    });

    it("should not return any objects in panoramas", () => {
        const geometry: PointsGeometry = new PointsGeometry([[0, 0], [1, 1]]);
        const extremePointTag: ExtremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 1 });
        const extremePointRenderTag: ExtremePointRenderTag =
            new ExtremePointRenderTag(
                extremePointTag,
                new TransformHelper().createTransform(new TransformHelper().createFullGPano()));

        const retrievableObjects: THREE.Object3D[] = extremePointRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(0);
    });
});

describe("ExtremePointRenderTag.dispose", () => {
    it("should dispose all materials and geometries", () => {
        const geometry: PointsGeometry = new PointsGeometry([[0, 0], [1, 1]]);

        const extremePointTag: ExtremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 1, lineOpacity: 1 });
        const extremePointRenderTag: ExtremePointRenderTag =
            new ExtremePointRenderTag(extremePointTag, new TransformHelper().createTransform());

        const glObjects: (THREE.Line | THREE.Mesh)[] = <(THREE.Line | THREE.Mesh)[]>extremePointRenderTag.getGLObjects();

        const disposeSpies: jasmine.Spy[] = [];
        for (const glObject of glObjects) {
            disposeSpies.push(spyOn(<THREE.Geometry>glObject.geometry, "dispose").and.stub());
            disposeSpies.push(spyOn(<THREE.Material>glObject.material, "dispose").and.stub());
        }

        extremePointRenderTag.dispose();

        for (const disposeSpy of disposeSpies) {
            expect(disposeSpy.calls.count()).toBe(1);
        }
    });
});
