import * as THREE from "three";
import * as vd from "virtual-dom";

import { Geometry } from "./geometry/Geometry";
import { CreateTag } from "./tag/CreateTag";
import { RenderTag } from "./tag/RenderTag";
import { Tag } from "./tag/Tag";

import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { ISpriteAtlas } from "../../viewer/interfaces/ISpriteAtlas";

export class TagDOMRenderer {
    public render(
        tags: RenderTag<Tag>[],
        createTag: CreateTag<Geometry>,
        atlas: ISpriteAtlas,
        camera: THREE.PerspectiveCamera,
        size: ViewportSize): vd.VNode {

        let vNodes: vd.VNode[] = [];

        for (const tag of tags) {
            vNodes = vNodes.concat(tag.getDOMObjects(atlas, camera, size));
        }

        if (createTag != null) {
            vNodes = vNodes.concat(createTag.getDOMObjects(camera, size));
        }

        return vd.h("div.mapillary-tag-container", {}, vNodes);
    }

    public clear(): vd.VNode {
        return vd.h("div", {}, []);
    }
}
