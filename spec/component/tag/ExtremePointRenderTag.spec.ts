import * as THREE from "three";
import { PointsGeometry } from "../../../src/component/tag/geometry/PointsGeometry";
import { ExtremePointRenderTag } from "../../../src/component/tag/tag/ExtremePointRenderTag";
import { ExtremePointTag } from "../../../src/component/tag/tag/ExtremePointTag";
import { TransformHelper } from "../../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("ExtremePointRenderTag.ctor", () => {
    it("should be defined", () => {
        const geometry = new PointsGeometry([[0, 0], [1, 1]]);
        const extremePointTag = new ExtremePointTag("id", geometry);
        const extremePointRenderTag =
            new ExtremePointRenderTag(extremePointTag, transformHelper.createTransform());

        expect(extremePointRenderTag).toBeDefined();
    });
});

describe("ExtremePointRenderTag.getRetrievableObjects", () => {
    it("should return a mesh object irrespective of fill opacity", () => {
        const geometry = new PointsGeometry([[0, 0], [1, 1]]);
        const extremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 1 });
        const extremePointRenderTag: ExtremePointRenderTag =
            new ExtremePointRenderTag(extremePointTag, transformHelper.createTransform());

        const retrievableObjects: THREE.Object3D[] = extremePointRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(1);
        expect(retrievableObjects[0] instanceof THREE.Mesh).toBe(true);

        const extremePointTagTransparent = new ExtremePointTag("id", geometry, { fillOpacity: 0 });
        const extremePointRenderTagTransparent =
            new ExtremePointRenderTag(extremePointTagTransparent, transformHelper.createTransform());

        const retrievableTransparentObjects: THREE.Object3D[] = extremePointRenderTagTransparent.getRetrievableObjects();

        expect(retrievableTransparentObjects.length).toBe(1);
        expect(retrievableTransparentObjects[0] instanceof THREE.Mesh).toBe(true);
    });

    it("should not return any objects in panoramas", () => {
        const geometry = new PointsGeometry([[0, 0], [1, 1]]);
        const extremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 1 });
        const extremePointRenderTag =
            new ExtremePointRenderTag(
                extremePointTag,
                transformHelper.createTransform("equirectangular"));

        const retrievableObjects: THREE.Object3D[] = extremePointRenderTag.getRetrievableObjects();

        expect(retrievableObjects.length).toBe(0);
    });
});

describe("ExtremePointRenderTag.dispose", () => {
    it("should dispose all materials and geometries", () => {
        const geometry = new PointsGeometry([[0, 0], [1, 1]]);

        const extremePointTag = new ExtremePointTag("id", geometry, { fillOpacity: 1, lineOpacity: 1 });
        const extremePointRenderTag =
            new ExtremePointRenderTag(extremePointTag, transformHelper.createTransform());

        const glObjects: (THREE.Line | THREE.Mesh)[] = <(THREE.Line | THREE.Mesh)[]>extremePointRenderTag.getGLObjects();

        const disposeSpies: jasmine.Spy[] = [];
        for (const glObject of glObjects) {
            disposeSpies.push(spyOn(<THREE.BufferGeometry>glObject.geometry, "dispose").and.stub());
            disposeSpies.push(spyOn(<THREE.Material>glObject.material, "dispose").and.stub());
        }

        extremePointRenderTag.dispose();

        for (const disposeSpy of disposeSpies) {
            expect(disposeSpy.calls.count()).toBe(1);
        }
    });
});
