import { ProjectorShaderMaterial } from "./ProjectorShaderMaterial";

export interface BBoxProjectorShaderMaterial extends ProjectorShaderMaterial {
    uniforms: {
        [uniform: string]: THREE.IUniform;
        opacity: THREE.IUniform;
        projectorTex: THREE.IUniform;
        bbox: THREE.IUniform;
    };
}
