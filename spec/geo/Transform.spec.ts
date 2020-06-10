import * as THREE from "three";

import {NodeHelper} from "../helper/NodeHelper.spec";
import {GeoHelper} from "../helper/GeoHelper.spec";

import {
    IGPano,
    IFillNode,
} from "../../src/API";
import {Transform} from "../../src/Geo";
import {Node} from "../../src/Graph";

describe("Transform.rt", () => {
    let epsilon: number = 10e-9;

    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have a unit Rt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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

    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have a unit sRt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.atomic_scale = 1;
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.atomic_scale = 3;
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.atomic_scale = 0.5;
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

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
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be width of node when landscape orientation", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.width = width;
        fillNode.orientation = 1;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.basicWidth).toBe(width);
    });

    it("should be height of node when portriat orientation", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.height = height;
        fillNode.orientation = 5;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.basicWidth).toBe(height);
    });
});

describe("Transform.basicHeight", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be height of node when landscape orientation", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.height = height;
        fillNode.orientation = 1;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.basicHeight).toBe(height);
    });

    it("should be width of node when portriat orientation", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.width = width;
        fillNode.orientation = 5;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.basicHeight).toBe(width);
    });
});

describe("Transform.width", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have fallback width", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());

        const fillNode: IFillNode = helper.createFillNode();
        fillNode.width = 0;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.width).toBe(4);
    });

    it("should have width of node", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.width = width;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.width).toBe(width);
    });
});

describe("Transform.height", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have fallback height", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.height = -1;
        fillNode.orientation = 1;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.height).toBe(3);
    });

    it("should have height of node", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.height = height;
        fillNode.orientation = 1;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.height).toBe(height);
    });
});

describe("Transform.focal", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have fallback focal", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.focal).toBe(1);
    });

    it("should have focal of node", () => {
        let focal: number = 0.84;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.cfocal = focal;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.focal).toBe(focal);
    });
});

describe("Transform.orientation", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have fallback orientation", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.orientation).toBe(1);
    });

    it("should have orientation of node", () => {
        let orientation: number = 3;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.orientation = 3;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.orientation).toBe(orientation);
    });
});

describe("Transform.scale", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should have fallback scale", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.scale).toBe(0);
    });

    it("should have scale of node", () => {
        let scale: number = 0.4;

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.atomic_scale = 0.4;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.scale).toBe(scale);
    });
});

describe("Transform.gpano", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should not have gpano set", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.gpano).toBeNull();
    });

    it("should have gpano set", () => {
        let gpano: IGPano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.gpano = gpano;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        expect(transform.gpano).not.toBeNull();
    });
});

describe("Transform.unprojectSfM", () => {
    let precision: number = 8;

    let geoHelper: GeoHelper;
    let helper: NodeHelper;

    beforeEach(() => {
        geoHelper = new GeoHelper();
        helper = new NodeHelper();
    });

    it("should return vertex at origin", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(0, precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(0, precision);
    });

    it("should return vertex at inverted translation", () => {
        let t: number[] = [10, -20, 30];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(-10, precision);
        expect(sfm[1]).toBeCloseTo(20, precision);
        expect(sfm[2]).toBeCloseTo(-30, precision);
    });

    it("should return vertex at camera center", () => {
        let r: number[] = [0, Math.PI / 2, 0];
        let C: number[] = [5, 8, 12];
        let t: number[] = geoHelper.getTranslation(r, C);

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(C[0], precision);
        expect(sfm[1]).toBeCloseTo(C[1], precision);
        expect(sfm[2]).toBeCloseTo(C[2], precision);
    });

    it("should return vertex 10 units front of origin in camera direction", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let depth: number = 10;
        let sfm: number[] = transform.unprojectSfM([0, 0], depth);

        expect(sfm[0]).toBeCloseTo(0, precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(depth, precision);
    });

    it("should return vertex shifted 5 units in all directions from camera center", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = r;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let depth: number = 5;
        let sfm: number[] = transform.unprojectSfM([0.5, 0], depth);

        expect(sfm[0]).toBeCloseTo(depth * Math.sin(Math.atan(0.5)), precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(depth * Math.cos(Math.atan(0.5)), precision);
    });
});

describe("Transform.projectBasic", () => {
    let precision: number = 8;

    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should project to the image center", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let pixel: number[] = transform.projectBasic([0, 0, 10]);

        expect(pixel[0]).toBeCloseTo(0.5, precision);
        expect(pixel[1]).toBeCloseTo(0.5, precision);
    });

    it("should project to the first quadrant", () => {
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let pixel: number[] = transform.projectBasic([1, 1, 10]);

        expect(pixel[0]).toBeGreaterThan(0);
        expect(pixel[1]).toBeGreaterThan(0);
    });
});

describe("Transform.unprojectBasic", () => {
    let precision: number = 6;

    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should back-project to the same pixel", () => {
        let t: number[] = [10, 20, 30];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = [0.1, 0.2, 0.3];
        fillNode.orientation = 1;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 3", () => {
        let t: number[] = [10, 20, 30];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = [0.1, 0.2, 0.3];
        fillNode.orientation = 3;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 6", () => {
        let t: number[] = [10, 20, 30];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = [0.1, 0.2, 0.3];
        fillNode.orientation = 6;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 8", () => {
        let t: number[] = [10, 20, 30];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = [0.1, 0.2, 0.3];
        fillNode.orientation = 8;
        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for full pano", () => {
        let t: number[] = [5, 15, 2];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = [0.5, -0.2, 0.3];
        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let basicPixel: number[] = [0.4534546, 0.72344564];

        let point: number[] = transform.unprojectBasic(basicPixel, 100);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(basicPixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(basicPixel[1], precision);
    });

    it("should back-project to the same pixel for cropped pano", () => {
        let t: number[] = [5, 15, 2];

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: IFillNode = helper.createFillNode();
        fillNode.c_rotation = [0.5, -0.2, 0.3];
        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 600,
            CroppedAreaImageWidthPixels: 400,
            CroppedAreaLeftPixels: 200,
            CroppedAreaTopPixels: 100,
            FullPanoHeightPixels: 1000,
            FullPanoWidthPixels: 2000,
        };

        node.makeFull(fillNode);

        let transform: Transform = new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            t,
            null);

        let basicPixel: number[] = [0.4534546, 0.72344564];

        let point: number[] = transform.unprojectBasic(basicPixel, 100);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(basicPixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(basicPixel[1], precision);
    });
});
