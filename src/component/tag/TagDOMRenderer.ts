/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    OutlineCreateTag,
    RenderTag,
    Tag,
} from "../../Component";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: RenderTag<Tag>[],
        createTag: OutlineCreateTag,
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera): vd.VNode {

        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);
        let projectionMatrix: THREE.Matrix4 = camera.projectionMatrix;

        let vNodes: vd.VNode[] = [];

        for (let tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(atlas, matrixWorldInverse, projectionMatrix));
        }

        if (createTag != null) {
            vNodes = vNodes.concat(createTag.getDOMObjects(matrixWorldInverse, projectionMatrix));
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }

    public clear(): vd.VNode {
        return vd.h("div", {}, []);
    }
}
