import * as THREE from "three";

import { ImageHelper } from "../helper/ImageHelper";
import { GeoHelper } from "../helper/GeoHelper";

import { Image } from "../../src/graph/Image";
import { Transform } from "../../src/geo/Transform";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { CameraType } from "../../src/geo/interfaces/CameraType";


describe("Transform.rt", () => {
    let epsilon: number = 10e-9;

    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have a unit Rt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let rt: THREE.Matrix4 = transform.rt;

        let elements: number[] = rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have an Rt matrix with rotation around z-axis", () => {
        let r: number[] = [0, 0, Math.PI];
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let rt: THREE.Matrix4 = transform.rt;

        let elements: number[] = rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(-1);
        expect(elements[1]).toBeLessThan(epsilon);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBeLessThan(epsilon);
        expect(elements[5]).toBe(-1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have an Rt matrix with rotation around x-axis", () => {
        let r: number[] = [Math.PI / 2, 0, 0];
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let rt: THREE.Matrix4 = transform.rt;

        let elements: number[] = rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBeLessThan(epsilon);
        expect(elements[6]).toBe(1);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(-1);
        expect(elements[10]).toBeLessThan(epsilon);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have an Rt matrix with translation", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [10, 20, 30];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let rt: THREE.Matrix4 = transform.rt;

        let elements: number[] = rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(10);
        expect(elements[13]).toBe(20);
        expect(elements[14]).toBe(30);
        expect(elements[15]).toBe(1);
    });
});

describe("Transform.srt", () => {
    let epsilon: number = 10e-8;

    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have a unit sRt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.atomic_scale = 1;
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let sRt: THREE.Matrix4 = transform.srt;

        let elements: number[] = sRt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have a scaled sRt matrix with rotation around y-axis", () => {
        let r: number[] = [0, Math.PI / 2, 0];
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.atomic_scale = 3;
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let sRt: THREE.Matrix4 = transform.srt;

        let elements: number[] = sRt.elements;

        // elements is a column-major array
        expect(elements[0]).toBeLessThan(epsilon);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(-3);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(3);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(3);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBeLessThan(epsilon);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have a scaled sRt matrix with scaled translation values", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [-10, 20, -30];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.atomic_scale = 0.5;
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let sRt: THREE.Matrix4 = transform.srt;

        let elements: number[] = sRt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(0.5);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(0.5);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(0.5);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(-5);
        expect(elements[13]).toBe(10);
        expect(elements[14]).toBe(-15);
        expect(elements[15]).toBe(1);
    });
});

describe("Transform.basicWidth", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should be width of image when landscape orientation", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.width = width;
        spatialImage.exif_orientation = 1;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.basicWidth).toBe(width);
    });

    it("should be height of image when portriat orientation", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.height = height;
        spatialImage.exif_orientation = 5;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.basicWidth).toBe(height);
    });
});

describe("Transform.basicHeight", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should be height of image when landscape orientation", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.height = height;
        spatialImage.exif_orientation = 1;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.basicHeight).toBe(height);
    });

    it("should be width of image when portriat orientation", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.width = width;
        spatialImage.exif_orientation = 5;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.basicHeight).toBe(width);
    });
});

describe("Transform.width", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have fallback width", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());

        const spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.width = 0;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.width).toBe(4);
    });

    it("should have width of image", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.width = width;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.width).toBe(width);
    });
});

describe("Transform.height", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have fallback height", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.height = -1;
        spatialImage.exif_orientation = 1;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.height).toBe(3);
    });

    it("should have height of image", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.height = height;
        spatialImage.exif_orientation = 1;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.height).toBe(height);
    });
});

describe("Transform.focal", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have fallback focal", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.focal).toBe(1);
    });

    it("should have focal of image", () => {
        let focal: number = 0.84;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.camera_parameters = [focal, 0, 0];
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.focal).toBe(focal);
    });
});

describe("Transform.orientation", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have fallback orientation", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.orientation).toBe(1);
    });

    it("should have orientation of image", () => {
        let orientation: number = 3;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.exif_orientation = 3;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.orientation).toBe(orientation);
    });
});

describe("Transform.scale", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should have fallback scale", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.scale).toBe(0);
    });

    it("should have scale of image", () => {
        let scale: number = 0.4;

        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.atomic_scale = 0.4;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        expect(transform.scale).toBe(scale);
    });
});

describe("Transform.unprojectSfM", () => {
    let precision: number = 8;

    let geoHelper: GeoHelper;
    let helper: ImageHelper;

    beforeEach(() => {
        geoHelper = new GeoHelper();
        helper = new ImageHelper();
    });

    it("should return vertex at origin", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(0, precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(0, precision);
    });

    it("should return vertex at inverted translation", () => {
        let t: number[] = [10, -20, 30];

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(-10, precision);
        expect(sfm[1]).toBeCloseTo(20, precision);
        expect(sfm[2]).toBeCloseTo(-30, precision);
    });

    it("should return vertex at camera center", () => {
        let r: number[] = [0, Math.PI / 2, 0];
        let C: number[] = [5, 8, 12];
        let t: number[] = geoHelper.getTranslation(r, C);

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(C[0], precision);
        expect(sfm[1]).toBeCloseTo(C[1], precision);
        expect(sfm[2]).toBeCloseTo(C[2], precision);
    });

    it("should return vertex 10 units front of origin in camera direction", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let depth: number = 10;
        let sfm: number[] = transform.unprojectSfM([0, 0], depth);

        expect(sfm[0]).toBeCloseTo(0, precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(depth, precision);
    });

    it("should return vertex shifted 5 units in all directions from camera center", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = r;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let depth: number = 5;
        let sfm: number[] = transform.unprojectSfM([0.5, 0], depth);

        expect(sfm[0]).toBeCloseTo(depth * Math.sin(Math.atan(0.5)), precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(depth * Math.cos(Math.atan(0.5)), precision);
    });
});

describe("Transform.projectBasic", () => {
    let precision: number = 8;

    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should project to the image center", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let pixel: number[] = transform.projectBasic([0, 0, 10]);

        expect(pixel[0]).toBeCloseTo(0.5, precision);
        expect(pixel[1]).toBeCloseTo(0.5, precision);
    });

    it("should project to the first quadrant", () => {
        let t: number[] = [0, 0, 0];

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let pixel: number[] = transform.projectBasic([1, 1, 10]);

        expect(pixel[0]).toBeGreaterThan(0);
        expect(pixel[1]).toBeGreaterThan(0);
    });
});

describe("Transform.unprojectBasic", () => {
    let precision: number = 6;

    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should back-project to the same pixel", () => {
        let t: number[] = [10, 20, 30];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = [0.1, 0.2, 0.3];
        spatialImage.exif_orientation = 1;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 3", () => {
        let t: number[] = [10, 20, 30];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = [0.1, 0.2, 0.3];
        spatialImage.exif_orientation = 3;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 6", () => {
        let t: number[] = [10, 20, 30];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = [0.1, 0.2, 0.3];
        spatialImage.exif_orientation = 6;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 8", () => {
        let t: number[] = [10, 20, 30];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = [0.1, 0.2, 0.3];
        spatialImage.exif_orientation = 8;
        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for spherical", () => {
        let t: number[] = [5, 15, 2];

        let image: Image = new Image(helper.createCoreImageEnt());
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        spatialImage.computed_rotation = [0.5, -0.2, 0.3];
        spatialImage.camera_type = "spherical";

        image.makeComplete(spatialImage);

        let transform: Transform = new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            t,
            null,
            null,
            image.cameraParameters,
            <CameraType>image.cameraType);

        let basicPixel: number[] = [0.4534546, 0.72344564];

        let point: number[] = transform.unprojectBasic(basicPixel, 100);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(basicPixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(basicPixel[1], precision);
    });
});
