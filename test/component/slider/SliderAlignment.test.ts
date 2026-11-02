import * as THREE from "three";
import { canLevelSliderComparison, canLevelSliderImage } from "../../../src/component/slider/SliderAlignment";
import { ProjectionService } from "../../../src/viewer/ProjectionService";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderConfigurationMode } from "../../../src/component/interfaces/SliderConfiguration";
import { Camera } from "../../../src/geo/Camera";
import { Image } from "../../../src/graph/Image";
import { Transform } from "../../../src/geo/Transform";

function image(vertices: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0], cameraType: string = "spherical"): Image {
    return { cameraType, mesh: { vertices, faces: [] } } as Image;
}
function transform(roll: number = 0, pitch: number = 0): Transform {
    const direction = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), pitch * Math.PI / 180);
    const up = new THREE.Vector3(0, 0, 1).applyAxisAngle(direction, roll * Math.PI / 180);
    return {
        upVector: () => up.clone(),
        unprojectBasic: (_: number[], depth: number) => direction.clone().multiplyScalar(depth).toArray(),
    } as unknown as Transform;
}

describe("Slider horizon safety", () => {
    it("does not level the reported image's empty reconstruction", () => {
        expect(canLevelSliderImage(image([]), transform(11, 67))).toBe(false);
    });
    it("does not trust a missing mesh", () => {
        expect(canLevelSliderImage({ mesh: null } as Image, transform())).toBe(false);
    });
    it("does not trust the default cube used by the comparison image", () => {
        const cube = { cameraType: "spherical", mesh: { vertices: Array(24).fill(1), faces: Array(36).fill(0) } } as Image;
        expect(canLevelSliderImage(cube, transform())).toBe(false);
    });
    it("levels a panorama with a real and plausible reconstruction", () => {
        expect(canLevelSliderImage(image(), transform(11, 5))).toBe(true);
    });
    it("rejects an implausible roll or pitch", () => {
        expect(canLevelSliderImage(image(), transform(46, 0))).toBe(false);
        expect(canLevelSliderImage(image(), transform(0, 80))).toBe(false);
    });
    it("retains the ordinary viewer's small perspective correction guard", () => {
        expect(canLevelSliderImage(image(undefined, "perspective"), transform(6))).toBe(false);
        expect(canLevelSliderImage(image(undefined, "perspective"), transform(8))).toBe(true);
    });
    it("levels comparison panoramas like other slider images", () => {
        expect(canLevelSliderComparison(image(), transform(38, 5), 1.6)).toBe(true);
        expect(canLevelSliderComparison(image(), transform(46, 0), 1.6)).toBe(false);
    });
    it("keeps a perspective comparison upright when the ordinary viewer would not level it", () => {
        // Reported pair: a separate reconstruction claims a 38 deg roll for an
        // upright phone photo; the viewer's auto-fit refuses to level it.
        const camera = new ProjectionService().makeCamera("perspective",
            [0.73551162611046, -0.0015303224124321, -0.018730651694032]);
        const reported = new Transform(3, 4032, 3024, 1,
            [-1.2223267744317, 1.2079613891934, 0.1647357955055], [0, 0, 0], null, camera);
        expect(canLevelSliderImage(image(undefined, "perspective"), reported)).toBe(true);
        expect(canLevelSliderComparison(image(undefined, "perspective"), reported, 1.6)).toBe(false);
    });
    it("uses the normal camera unchanged when foreground gravity is untrusted", () => {
        const renderer = new SliderGLRenderer() as any;
        renderer._gravityAligned = true;
        renderer._currentGravityAligned = false;
        const camera = new THREE.PerspectiveCamera();
        expect(renderer._getCurrentPerspective(camera)).toBe(camera);
    });
    it("levels the foreground camera without mutating the normal viewer camera", () => {
        const renderer = new SliderGLRenderer() as any;
        renderer._currentGravityAligned = true;
        const camera = new THREE.PerspectiveCamera();
        camera.up.set(0, 1, 0);
        camera.lookAt(1, 0, 0);
        camera.updateMatrixWorld(true);
        const leveled = renderer._getCurrentPerspective(camera);
        expect(leveled.up.toArray()).toEqual([0, 0, 1]);
        expect(camera.up.toArray()).toEqual([0, 1, 0]);
    });
    it("renders uncalibrated comparisons in their own upright camera frame", () => {
        const renderer = new SliderGLRenderer() as any;
        renderer._gravityAligned = true;
        renderer._mode = SliderConfigurationMode.Motion;
        renderer._previousCamera = new Camera();
        renderer._previousCamera.up.set(0, 1, 0);
        const camera = new THREE.PerspectiveCamera();
        const previous = renderer._getPreviousPerspective(camera);
        expect(previous).not.toBe(camera);
        expect(previous.up.toArray()).toEqual([0, 1, 0]);
    });
    it("recenters an independent panorama camera on its recentered mesh", () => {
        const renderer = new SliderGLRenderer() as any;
        renderer._gravityAligned = true;
        renderer._previousSpherical = true;
        renderer._mode = SliderConfigurationMode.Motion;
        renderer._previousCamera = new Camera();
        renderer._previousCamera.position.set(20, 10, 4);
        renderer._previousCamera.lookat.set(21, 10, 4);
        const camera = new THREE.PerspectiveCamera();
        camera.position.set(2, 3, 4);
        const previous = renderer._getPreviousPerspective(camera);
        expect(previous.position.toArray()).toEqual([2, 3, 4]);
        const direction = previous.getWorldDirection(new THREE.Vector3());
        expect(direction.x).toBeCloseTo(1);
        expect(direction.y).toBeCloseTo(0);
        expect(direction.z).toBeCloseTo(0);
    });

    it("preserves the legacy shared camera when leveling is switched off", () => {
        const renderer = new SliderGLRenderer() as any;
        renderer._mode = SliderConfigurationMode.Motion;
        const camera = new THREE.PerspectiveCamera();
        expect(renderer._getPreviousPerspective(camera)).toBe(camera);
    });
});
