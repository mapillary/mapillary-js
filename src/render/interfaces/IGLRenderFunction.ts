/// <reference path="../../../typings/threejs/three.d.ts" />

import * as THREE from "three";

export interface IGLRenderFunction extends Function {
    (
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ): void;
}

export default IGLRenderFunction;
