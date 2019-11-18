import * as THREE from "three";

import {RenderTag, Tag, CreateTag, Geometry} from "../../Component";

type TagObjects = {
    tag: RenderTag<Tag>;
    objects: THREE.Object3D[];
    retrievableObjects: THREE.Object3D[];
};

type CreateTagObjects = {
    tag: CreateTag<Geometry>;
    objects: THREE.Object3D[];
};

export class TagScene {
    private _createTag: CreateTagObjects;
    private _needsRender: boolean;
    private _objectTags: { [uuid: string]: string };
    private _raycaster: THREE.Raycaster;
    private _retrievableObjects: THREE.Object3D[];
    private _scene: THREE.Scene;
    private _tags: { [id: string]: TagObjects };

    constructor(scene?: THREE.Scene, raycaster?: THREE.Raycaster) {
        this._createTag = null;
        this._needsRender = false;
        this._raycaster = !!raycaster ? raycaster : new THREE.Raycaster();
        this._scene = !!scene ? scene : new THREE.Scene();

        this._objectTags = {};
        this._retrievableObjects = [];
        this._tags = {};
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public add(tags: RenderTag<Tag>[]): void {
        for (let tag of tags) {
            if (tag.tag.id in this._tags) {
                this._remove(tag.tag.id);
            }

            this._add(tag);
        }

        this._needsRender = true;
    }

    public addCreateTag(tag: CreateTag<Geometry>): void {
        for (const object of tag.glObjects) {
            this._scene.add(object);
        }

        this._createTag = { tag: tag, objects: tag.glObjects };

        this._needsRender = true;
    }

    public clear(): void {
        for (const id of Object.keys(this._tags)) {
            this._remove(id);
        }

        this._needsRender = false;
    }

    public get(id: string): RenderTag<Tag> {
        return this.has(id) ? this._tags[id].tag : undefined;
    }

    public has(id: string): boolean {
        return id in this._tags;
    }

    public hasCreateTag(): boolean {
        return this._createTag != null;
    }

    public intersectObjects([viewportX, viewportY]: number[], camera: THREE.Camera): string[] {
        this._raycaster.setFromCamera(new THREE.Vector2(viewportX, viewportY), camera);

        const intersects: THREE.Intersection[] = this._raycaster.intersectObjects(this._retrievableObjects);
        const intersectedIds: string[] = [];
        for (const intersect of intersects) {
            if (intersect.object.uuid in this._objectTags) {
                intersectedIds.push(this._objectTags[intersect.object.uuid]);
            }
        }

        return intersectedIds;
    }

    public remove(ids: string[]): void {
        for (const id of ids) {
            this._remove(id);
        }

        this._needsRender = true;
    }

    public removeAll(): void {
        for (const id of Object.keys(this._tags)) {
            this._remove(id);
        }

        this._needsRender = true;
    }

    public removeCreateTag(): void {
        if (this._createTag == null) {
            return;
        }

        for (const object of this._createTag.objects) {
            this._scene.remove(object);
        }

        this._createTag.tag.dispose();
        this._createTag = null;

        this._needsRender = true;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.Renderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    public update(): void {
        this._needsRender = true;
    }

    public updateCreateTagObjects(tag: CreateTag<Geometry>): void {
        if (this._createTag.tag !== tag) {
            throw new Error("Create tags do not have the same reference.");
        }

        for (let object of this._createTag.objects) {
            this._scene.remove(object);
        }

        for (const object of tag.glObjects) {
            this._scene.add(object);
        }

        this._createTag.objects = tag.glObjects;

        this._needsRender = true;
    }

    public updateObjects(tag: RenderTag<Tag>): void {
        const id: string = tag.tag.id;

        if (this._tags[id].tag !== tag) {
            throw new Error("Tags do not have the same reference.");
        }

        const tagObjects: TagObjects = this._tags[id];

        this._removeObjects(tagObjects);

        delete this._tags[id];

        this._add(tag);
        this._needsRender = true;
    }

    private _add(tag: RenderTag<Tag>): void {
        const id: string = tag.tag.id;
        const tagObjects: TagObjects = { tag: tag, objects: [], retrievableObjects: [] };

        this._tags[id] = tagObjects;

        for (const object of tag.getGLObjects()) {
            tagObjects.objects.push(object);
            this._scene.add(object);
        }

        for (const retrievableObject of tag.getRetrievableObjects()) {
            tagObjects.retrievableObjects.push(retrievableObject);
            this._retrievableObjects.push(retrievableObject);
            this._objectTags[retrievableObject.uuid] = tag.tag.id;
        }
    }

    private _remove(id: string): void {
        const tagObjects: TagObjects = this._tags[id];

        this._removeObjects(tagObjects);

        tagObjects.tag.dispose();

        delete this._tags[id];
    }

    private _removeObjects(tagObjects: TagObjects): void {
        for (const object of tagObjects.objects) {
            this._scene.remove(object);
        }

        for (const retrievableObject of tagObjects.retrievableObjects) {
            const index: number = this._retrievableObjects.indexOf(retrievableObject);
            if (index !== -1) {
                this._retrievableObjects.splice(index, 1);
            }
        }
    }
}

export default TagScene;
