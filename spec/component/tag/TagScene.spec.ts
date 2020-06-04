import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    RectGeometry,
    RenderTag,
    Tag,
    TagScene,
} from "../../../src/Component";
import {ISize} from "../../../src/Render";
import {ISpriteAtlas} from "../../../src/Viewer";

describe("TagScene.ctor", () => {
    it("should be defined", () => {
        const tagScene: TagScene = new TagScene();

        expect(tagScene).toBeDefined();
    });

    it("should not need render after being created", () => {
        const tagScene: TagScene = new TagScene();

        expect(tagScene.needsRender).toBe(false);
    });
});

class TestTag extends Tag {
    private _testProp: number = 0;

    public get testProp(): number {
        return this._testProp;
    }

    public set testProp(value: number) {
        this._testProp = value;
        this._notifyChanged$.next(this);
    }
 }

class TestRenderTag extends RenderTag<Tag> {
    public dispose(): void { /*noop*/ }
    public getDOMObjects(atlas: ISpriteAtlas, camera: THREE.Camera, size: ISize): vd.VNode[] { return []; }
    public getGLObjects(): THREE.Object3D[] { return []; }
    public getRetrievableObjects(): THREE.Object3D[] { return []; }
}

describe("TagScene.add", () => {
    it("should add a single render tag", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        tagScene.add([renderTag]);

        const result: RenderTag<Tag> = tagScene.get(renderTag.tag.id);

        expect(result).toBeDefined();
        expect(result.tag.id).toBe(renderTag.tag.id);
        expect(result).toBe(renderTag);
    });

    it("should add multiple render tags", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag1: TestTag = new TestTag("id1", geometry);
        const renderTag1: TestRenderTag = new TestRenderTag(tag1, undefined);
        const tag2: TestTag = new TestTag("id2", geometry);
        const renderTag2: TestRenderTag = new TestRenderTag(tag2, undefined);

        tagScene.add([renderTag1, renderTag2]);

        const result1: RenderTag<Tag> = tagScene.get(renderTag1.tag.id);

        expect(result1).toBeDefined();
        expect(result1.tag.id).toBe(renderTag1.tag.id);
        expect(result1).toBe(renderTag1);

        const result2: RenderTag<Tag> = tagScene.get(renderTag2.tag.id);

        expect(result2).toBeDefined();
        expect(result2.tag.id).toBe(renderTag2.tag.id);
        expect(result2).toBe(renderTag2);
    });
});

describe("TagScene.has", () => {
    it("should have an added tag", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        tagScene.add([renderTag]);

        expect(tagScene.has(renderTag.tag.id)).toBe(true);
        expect(tagScene.has("other-id")).toBe(false);
    });
});

describe("TagScene.remove", () => {
    it("should remove a single tag", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        tagScene.add([renderTag]);
        tagScene.remove([renderTag.tag.id]);

        expect(tagScene.has(renderTag.tag.id)).toBe(false);
        expect(tagScene.get(renderTag.tag.id)).toBeUndefined();
    });

    it("should remove a multiple tags", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag1: TestTag = new TestTag("id1", geometry);
        const renderTag1: TestRenderTag = new TestRenderTag(tag1, undefined);
        const tag2: TestTag = new TestTag("id2", geometry);
        const renderTag2: TestRenderTag = new TestRenderTag(tag2, undefined);

        tagScene.add([renderTag1, renderTag2]);
        tagScene.remove([renderTag1.tag.id, renderTag2.tag.id]);

        expect(tagScene.has(renderTag1.tag.id)).toBe(false);
        expect(tagScene.get(renderTag1.tag.id)).toBeUndefined();

        expect(tagScene.has(renderTag2.tag.id)).toBe(false);
        expect(tagScene.get(renderTag2.tag.id)).toBeUndefined();
    });
});

describe("TagScene.removeAll", () => {
    it("should remove a single tag", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        tagScene.add([renderTag]);
        tagScene.removeAll();

        expect(tagScene.has(renderTag.tag.id)).toBe(false);
        expect(tagScene.get(renderTag.tag.id)).toBeUndefined();
    });

    it("should remove a multiple tags", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag1: TestTag = new TestTag("id1", geometry);
        const renderTag1: TestRenderTag = new TestRenderTag(tag1, undefined);
        const tag2: TestTag = new TestTag("id2", geometry);
        const renderTag2: TestRenderTag = new TestRenderTag(tag2, undefined);

        tagScene.add([renderTag1, renderTag2]);
        tagScene.removeAll();

        expect(tagScene.has(renderTag1.tag.id)).toBe(false);
        expect(tagScene.get(renderTag1.tag.id)).toBeUndefined();

        expect(tagScene.has(renderTag2.tag.id)).toBe(false);
        expect(tagScene.get(renderTag2.tag.id)).toBeUndefined();
    });
});

class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public render(s: THREE.Scene, c: THREE.Camera): void { return; }
    public setSize(w: number, h: number, updateStyle?: boolean): void { return; }
    public setClearColor(c: THREE.Color, o: number): void { return; }
    public setPixelRatio(ratio: number): void { return; }
    public clear(): void { return; }
    public clearDepth(): void { return; }
}

describe("TagScene.needsRender", () => {
    it("should need render after changes", () => {
        const renderer: THREE.Renderer = new RendererMock();
        spyOn(renderer, "render").and.stub();

        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        expect(tagScene.needsRender).toBe(false);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        tagScene.add([renderTag]);
        expect(tagScene.needsRender).toBe(true);

        tagScene.render(new THREE.PerspectiveCamera(), renderer);
        expect(tagScene.needsRender).toBe(false);

        tagScene.remove([renderTag.tag.id]);
        expect(tagScene.needsRender).toBe(true);

        tagScene.add([renderTag]);
        tagScene.render(new THREE.PerspectiveCamera(), renderer);
        tagScene.removeAll();
        expect(tagScene.needsRender).toBe(true);

        tagScene.render(new THREE.PerspectiveCamera(), renderer);
        tagScene.update();

        expect(tagScene.needsRender).toBe(true);

        tagScene.add([renderTag]);
        tagScene.render(new THREE.PerspectiveCamera(), renderer);
        tagScene.updateObjects(renderTag);

        expect(tagScene.needsRender).toBe(true);
    });
});

describe("TagScene.updateObjects", () => {
    it("should update objects that are rendered", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        let first: boolean = true;
        const firstObject: THREE.Object3D = new THREE.Object3D();
        const secondObject: THREE.Object3D = new THREE.Object3D();
        spyOn(renderTag, "getGLObjects").and.callFake(
            () => {
                if (first) {
                    first = false;
                    return [firstObject];
                } else {
                    return [secondObject];
                }
            });

        tagScene.add([renderTag]);

        expect(scene.children.length).toBe(1);
        expect(scene.children[0]).toBe(firstObject);
        expect(scene.children[0].uuid).toBe(firstObject.uuid);

        tagScene.updateObjects(renderTag);

        expect(scene.children.length).toBe(1);
        expect(scene.children[0]).toBe(secondObject);
        expect(scene.children[0].uuid).toBe(secondObject.uuid);
    });

    it("should throw if instance is not the same as added", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);

        tagScene.add([renderTag]);

        const tagCopy: TestTag = new TestTag("id", geometry);
        const renderTagCopy: TestRenderTag = new TestRenderTag(tagCopy, undefined);

        expect(() => { tagScene.updateObjects(renderTagCopy); }).toThrow();
    });
});

describe("TagScene.intersectObjects", () => {
    it("should intersect the retrievable object of the tag", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        spyOn(raycaster, "setFromCamera").and.stub();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);
        const retrievableObject: THREE.Object3D = new THREE.Object3D();
        spyOn(renderTag, "getRetrievableObjects").and.returnValue([retrievableObject]);

        tagScene.add([renderTag]);

        const intersectObjectsSpy: jasmine.Spy = spyOn(raycaster, "intersectObjects");
        intersectObjectsSpy.and.returnValue([]);

        const result: string[] = tagScene.intersectObjects([0, 0], new THREE.Camera());

        expect(result.length).toBe(0);

        expect(intersectObjectsSpy.calls.count()).toBe(1);
        expect(intersectObjectsSpy.calls.argsFor(0)[0].length).toBe(1);
        expect(intersectObjectsSpy.calls.argsFor(0)[0][0]).toBe(retrievableObject);
        expect(intersectObjectsSpy.calls.argsFor(0)[0][0].uuid).toBe(retrievableObject.uuid);
    });

    it("should return the tag id of the retrievable object", () => {
        const scene: THREE.Scene = new THREE.Scene();
        const raycaster: THREE.Raycaster = new THREE.Raycaster();
        spyOn(raycaster, "setFromCamera").and.stub();
        const tagScene: TagScene = new TagScene(scene, raycaster);

        const geometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);
        const tag: TestTag = new TestTag("id", geometry);
        const renderTag: TestRenderTag = new TestRenderTag(tag, undefined);
        const retrievableObject: THREE.Object3D = new THREE.Object3D();
        spyOn(renderTag, "getRetrievableObjects").and.returnValue([retrievableObject]);

        tagScene.add([renderTag]);

        spyOn(raycaster, "intersectObjects").and.returnValue([<THREE.Intersection>{ object: retrievableObject }]);

        const result: string[] = tagScene.intersectObjects([0, 0], new THREE.Camera());

        expect(result.length).toBe(1);
        expect(result[0]).toBe(tag.id);
    });
});
