import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    OutlineCreateTag,
    RenderTag,
    Tag,
} from "../../Component";
import {ISize} from "../../Render";
import {ISpriteAtlas} from "../../Viewer";
import { ExtremePointCreateTag } from "./tag/ExtremePointCreateTag";

export class TagDOMRenderer {
    public render(
        tags: RenderTag<Tag>[],
        createTag: OutlineCreateTag,
        extremeCreateTag: ExtremePointCreateTag,
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

        if (extremeCreateTag != null) {
            vNodes = vNodes.concat(extremeCreateTag.getDOMObjects(camera, size));
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }

    public clear(): vd.VNode {
        return vd.h("div", {}, []);
    }
}
