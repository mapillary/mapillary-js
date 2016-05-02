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

        let vNodes: vd.VNode[] = tags
            .map((tag): vd.VNode => {
                return tag.getDOMGeometry(atlas, camera, transform);
            });

        return vd.h("div.TagContainer", {}, vNodes);
    }
}
