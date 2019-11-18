import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    RenderTag,
    Tag,
    CreateTag,
    Geometry,
} from "../../Component";
import {ISize} from "../../Render";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    public render(
        tags: RenderTag<Tag>[],
        createTag: CreateTag<Geometry>,
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        size: ISize): vd.VNode {

        let vNodes: vd.VNode[] = [];

        for (const tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(atlas, camera, size));
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
