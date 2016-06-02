/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {SpriteAlignment} from "../../Viewer";

export interface ISpriteAtlas {
    loaded: boolean;
    getGLSprite(name: string): THREE.Object3D;
    getDOMSprite(name: string, horizontalAlign?: SpriteAlignment, verticalAlign?: SpriteAlignment): vd.VNode;
}

export default ISpriteAtlas;
