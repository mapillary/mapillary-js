/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    OutlineCreateTag,
    RenderTag,
    Tag,
} from "../../Component";
import {ISize} from "../../Render";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: RenderTag<Tag>[],
        createTag: OutlineCreateTag,
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        size: ISize): vd.VNode {

        const matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);
        const projectionMatrix: THREE.Matrix4 = camera.projectionMatrix;

        let vNodes: vd.VNode[] = [];

        for (const tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(atlas, matrixWorldInverse, projectionMatrix));
        }

        if (createTag != null) {
            vNodes = vNodes.concat(createTag.getDOMObjects(camera, size));
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }

    public clear(): vd.VNode {
        return vd.h("div", {}, []);
    }
}
