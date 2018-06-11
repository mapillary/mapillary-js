import * as THREE from "three";

export interface IShaderMaterial extends THREE.ShaderMaterial {
    uniforms: {
        [uniform: string]: THREE.IUniform;
        opacity: THREE.IUniform;
        projectorTex: THREE.IUniform;
    };
}
