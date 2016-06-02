/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Tag, OutlineCreateTag} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: Tag[],
        createTag: OutlineCreateTag,
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        transform: Transform): vd.VNode {

        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);
        let projectionMatrix: THREE.Matrix4 = camera.projectionMatrix;

        let vNodes: vd.VNode[] = [];

        for (let tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(transform, atlas, matrixWorldInverse, projectionMatrix));
        }

        if (createTag != null) {
            vNodes = vNodes.concat(createTag.getDOMObjects(transform, matrixWorldInverse, projectionMatrix));
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }
}
