import * as THREE from "three";

export interface GLRenderFunction extends Function {
    (
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
    ): void;
}
