import {
    fragment as textureFragment,
    vertex as textureVertex,
} from "./shaders/texture.glsl";

export interface GLShader {
    fragment: string;
    vertex: string;
}

// tslint:disable-next-line:variable-name
export const Shader: { [name: string]: GLShader; } = {
    texture: {
        fragment: textureFragment,
        vertex: textureVertex,
    },
};
