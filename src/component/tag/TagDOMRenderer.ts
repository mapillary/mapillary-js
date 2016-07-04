/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    ITagConfiguration,
    OutlineCreateTag,
    Tag,
} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: Tag[],
        createTag: OutlineCreateTag,
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        transform: Transform,
        configuration: ITagConfiguration): vd.VNode {

        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);
        let projectionMatrix: THREE.Matrix4 = camera.projectionMatrix;

        let vNodes: vd.VNode[] = [];

        for (let tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(transform, atlas, matrixWorldInverse, projectionMatrix));
        }

        if (createTag != null) {
            vNodes = vNodes.concat(createTag.getDOMObjects(transform, matrixWorldInverse, projectionMatrix));
        }

        let properties: vd.createProperties = {
            style: {
                "pointer-events": configuration.creating ? "all" : "none",
            },
        };

        return vd.h("div.TagContainer", properties, vNodes);
    }
}
