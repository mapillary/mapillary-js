/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {TagBase} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: TagBase[],
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        transform: Transform): vd.VNode {

        let vNodes: vd.VNode[] = [];

        for (let tag of tags) {
            vNodes = vNodes.concat(tag.getDOMGeometry(atlas, camera, transform));
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }
}
