/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Float} from "../../Viewer";

export interface ISpriteAtlas {
    loaded: boolean;
    getGLSprite(name: string): THREE.Object3D;
    getDOMSprite(name: string, float?: Float): vd.VNode;
}

export default ISpriteAtlas;
