import * as THREE from "three";

export interface ProjectorShaderMaterial extends THREE.ShaderMaterial {
    uniforms: {
        [uniform: string]: THREE.IUniform;
        opacity: THREE.IUniform;
        projectorTex: THREE.IUniform;
    };
}
