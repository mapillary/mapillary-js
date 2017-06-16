/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {OutlineCreateTag, RenderTag, Tag} from "../../Component";

type TagObjects = {
    tag: RenderTag<Tag>;
    objects: THREE.Object3D[];
};

type CreateTagObjects = {
    tag: OutlineCreateTag;
    objects: THREE.Object3D[];
};

export class TagScene {
    private _createTag: CreateTagObjects;
    private _needsRender: boolean;
    private _scene: THREE.Scene;
    private _tags: { [key: string]: TagObjects };

    constructor() {
        this._createTag = null;
        this._needsRender = false;
        this._scene = new THREE.Scene();
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

    public addCreateTag(tag: OutlineCreateTag): void {
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

    public hasCreateTag(): boolean {
        return this._createTag != null;
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
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    public update(): void {
        this._needsRender = true;
    }

    public updateCreateTagObjects(tag: OutlineCreateTag): void {
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

        for (let object of this._tags[id].objects) {
            this._scene.remove(object);
        }

        delete this._tags[id];

        this._add(tag);

        this._needsRender = true;
    }

    private _add(tag: RenderTag<Tag>): void {
        const id: string = tag.tag.id;
        const objects: THREE.Object3D[] = tag.glObjects;

        this._tags[id] = { tag: tag, objects: [] };

        for (let object of objects) {
            this._tags[id].objects.push(object);
            this._scene.add(object);
        }
    }

    private _remove(id: string): void {
        for (const object of this._tags[id].objects) {
            this._scene.remove(object);
        }

        this._tags[id].tag.dispose();

        delete this._tags[id];
    }
}

export default TagScene;
