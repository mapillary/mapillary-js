import {
    CameraParameters,
    CameraUniforms,
    ICamera,
} from "../geometry/interfaces/ICamera";
import { ShaderChunk } from "./ShaderChunk";

const expandPattern = /^[ \t]*#expand +<([\w\d./]+)>/gm;
const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;

function expandParameters(parameters: CameraParameters): string {
    const keys = Object.keys(parameters);
    if (keys.length === 0) {
        return "";
    }

    const variables = keys
        .map(key => `float ${key};`);

    const expansion = `
${variables.map(v => `uniform ${v}`).join("\n")}

struct Parameters {
${variables.map(v => `    ${v}`).join("\n")}
};
`;

    return expansion;
}

function expandUniforms(uniforms: CameraUniforms): string {
    const keys = Object.keys(uniforms);
    if (keys.length === 0) {
        return "";
    }

    const variables = [];
    for (const key of keys) {
        const value = uniforms[key];
        if (typeof value === 'boolean') {
            variables.push(`bool ${key};`);
        } else if (typeof value === 'number') {
            variables.push(`float ${key};`);
        } else if (value instanceof Array) {
            switch (value.length) {
                case 2:
                    variables.push(`vec2 ${key};`);
                    break;
                case 3:
                    variables.push(`vec3 ${key};`);
                    break;
                case 4:
                    variables.push(`vec4 ${key};`);
                    break;
                case 9:
                    variables.push(`mat3 ${key};`);
                    break;
                case 16:
                    variables.push(`mat4 ${key};`);
                    break;
                default:
                    throw new Error('Can not #expand vector of length <' + value.length + '>');
            }
        } else {
            throw new Error('Can not #expand instance <' + value + '>');
        }
    }

    const expansion = `
${variables.map(v => `uniform ${v}`).join("\n")}

struct Uniforms {
${variables.map(v => `    ${v}`).join("\n")}
};
    `;

    return expansion;
}

function expandProjectToSfmDefinition(definition: string): string {
    return definition;
}

function expandProjectToSfmInvocation(
    parameters: CameraParameters,
    uniforms: CameraUniforms): string {

    const parameterKeys = Object.keys(parameters);
    const uniformKeys = Object.keys(uniforms);

    const p = parameterKeys.length > 0 ?
        `Parameters parameters = Parameters(${parameterKeys.join(', ')});` :
        "";
    const u = uniformKeys.length > 0 ?
        `Uniforms uniforms = Uniforms(${uniformKeys.join(', ')});` :
        "";
    const project = `vec2 sfm = projectToSfm(bearing${parameterKeys.length > 0 ? ", parameters" : ""}${uniformKeys.length > 0 ? ", uniforms" : ""});`;

    const expansion = `
    ${p}
    ${u}
    ${project}
    `;

    return expansion;
}

function includeReplacer(_match: string, include: keyof typeof ShaderChunk): string {
    const chunk = ShaderChunk[include];
    if (chunk === undefined) {
        throw new Error('Can not resolve #include <' + include + '>');
    }
    return resolveIncludes(chunk);
}

function resolveIncludes(shader: string): string {
    return shader.replace(includePattern, includeReplacer);
}

function resolveExpands(
    shader: string,
    projectToSfmFunction: string,
    parameters: CameraParameters,
    uniforms: CameraUniforms): string {

    function expandReplacer(_match: string, expand: string): string {
        switch (expand) {
            case "parameters":
                return expandParameters(parameters);
            case "uniforms":
                return expandUniforms(uniforms);
            case "project_to_sfm_definition":
                return expandProjectToSfmDefinition(projectToSfmFunction);
            case "project_to_sfm_invocation":
                return expandProjectToSfmInvocation(parameters, uniforms);
            default:
                throw new Error('Can not resolve #expand <' + expand + '>');
        }
    }

    return shader.replace(expandPattern, expandReplacer);
};

export function resolveShader(
    shader: string,
    camera: ICamera): string {
    return resolveExpands(
        resolveIncludes(shader),
        camera.projectToSfmFunction,
        camera.parameters,
        camera.uniforms);
}
