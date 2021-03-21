import * as THREE from "three";
import * as vd from "virtual-dom";

import { Alignment } from "../enums/Alignment";

export interface ISpriteAtlas {
    loaded: boolean;
    getGLSprite(name: string): THREE.Object3D;
    getDOMSprite(name: string, float?: Alignment): vd.VNode;
}
