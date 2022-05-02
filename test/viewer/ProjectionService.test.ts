import { FisheyeCamera, FISHEYE_CAMERA_TYPE } from "../../src/geometry/camera/FisheyeCamera";
import { PerspectiveCamera, PERSPECTIVE_CAMERA_TYPE } from "../../src/geometry/camera/PerspectiveCamera";
import { SphericalCamera, SPHERICAL_CAMERA_TYPE } from "../../src/geometry/camera/SphericalCamera";
import { CameraParameters, CameraUniforms, ICamera } from "../../src/mapillary";
import { GLShader, Shader } from "../../src/shader/Shader";
import { ProjectionService } from "../../src/viewer/ProjectionService";

describe("ProjectionService.ctor", () => {
    it("should be defined when constructed", () => {
        const service = new ProjectionService();
        expect(service).toBeDefined();
    });

    it("should register default cameras", () => {
        const service = new ProjectionService();
        service.hasCamera(FISHEYE_CAMERA_TYPE);
        service.hasCamera(PERSPECTIVE_CAMERA_TYPE);
        service.hasCamera(SPHERICAL_CAMERA_TYPE);
    });

    it("should set default shader", () => {
        const service = new ProjectionService();
        const shader = service.getShader();

        expect(shader.fragment).toBe(Shader.texture.fragment);
        expect(shader.vertex).toBe(Shader.texture.vertex);

    });
});

describe("ProjectionService.makeCamera", () => {
    it("should make a fisheye camera", () => {
        const service = new ProjectionService();
        const camera = service.makeCamera(FISHEYE_CAMERA_TYPE, [1, 0, 0]);
        expect(camera).toBeInstanceOf(FisheyeCamera);
    });

    it("should make a perspective camera", () => {
        const service = new ProjectionService();
        const camera = service.makeCamera(PERSPECTIVE_CAMERA_TYPE, [1, 0, 0]);
        expect(camera).toBeInstanceOf(PerspectiveCamera);
    });

    it("should make a spherical camera", () => {
        const service = new ProjectionService();
        const camera = service.makeCamera(SPHERICAL_CAMERA_TYPE, []);
        expect(camera).toBeInstanceOf(SphericalCamera);
    });
});

describe("ProjectionService.setShader", () => {
    it("should set a custom shader", () => {
        const service = new ProjectionService();
        const shader: GLShader = {
            fragment: "fragment",
            vertex: "vertex",
        };
        service.setShader(shader);

        const result = service.getShader();
        expect(result).toStrictEqual(shader);
        expect(result.fragment).toBe(shader.fragment);
        expect(result.vertex).toBe(shader.vertex);
    });

    it("should reset to default shader", () => {
        const service = new ProjectionService();
        const shader: GLShader = {
            fragment: "fragment",
            vertex: "vertex",
        };
        service.setShader(shader);
        service.setShader();

        const result = service.getShader();
        expect(result).toStrictEqual(Shader.texture);
        expect(result.fragment).not.toBe(shader);
    });
});

describe("ProjectionService.registerCamera", () => {
    it("should register a custom camera", () => {
        const service = new ProjectionService();

        const type = "custom";
        class CustomCamera implements ICamera {
            type: string = type;
            parameters: CameraParameters = {};
            uniforms: CameraUniforms = {};
            projectToSfmFunction: string = "";
            bearingFromSfm(): number[] {
                return [0, 0, 0];
            }
            projectToSfm(): number[] {
                return [0, 0];
            }
        }

        service.registerCamera(type, CustomCamera);
        const camera = service.makeCamera(type, []);

        expect(camera).toBeInstanceOf(CustomCamera);
    });
});

describe("ProjectionService.shader$", () => {
    it("should emit set shader", (done: Function) => {
        const service = new ProjectionService();

        const shader: GLShader = {
            fragment: "fragment",
            vertex: "vertex",
        };

        service.shader$
            .subscribe(
                (emitted: GLShader): void => {
                    expect(emitted).toStrictEqual(shader);
                    done();
                });

        service.setShader(shader);
    });
});
