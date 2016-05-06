/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Tag} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: Tag[],
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        transform: Transform): vd.VNode {

        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);
        let projectionMatrix: THREE.Matrix4 = camera.projectionMatrix;

        let vNodes: vd.VNode[] = [];

        for (let tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(transform, atlas, matrixWorldInverse, projectionMatrix));
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }
}
