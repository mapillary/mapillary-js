export interface SliderBBoxProjectorShaderMaterial extends THREE.ShaderMaterial  {
    uniforms: {
        [uniform: string]: THREE.IUniform;
        opacity: THREE.IUniform;
        projectorTex: THREE.IUniform;
        bbox: THREE.IUniform;
    };
}
