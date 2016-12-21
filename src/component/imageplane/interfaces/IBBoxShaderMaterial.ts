import {IShaderMaterial} from "../../../Component";

export interface IBBoxShaderMaterial extends IShaderMaterial {
    uniforms: {
        [uniform: string]: THREE.IUniform;
        opacity: THREE.IUniform;
        projectorTex: THREE.IUniform;
        bbox: THREE.IUniform;
    };
}
