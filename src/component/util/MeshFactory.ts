import * as THREE from "three";

import { Shaders } from "../shaders/Shaders";

import { Transform } from "../../geo/Transform";
import { Image } from "../../graph/Image";
import { isFisheye, isSpherical } from "../../geo/Geo";
import { IUniform, Matrix3, Matrix4, Vector2, Vector3, Vector4 } from "three";
import { Camera } from "../../geometry/Camera";

import {
    fragment as defaultFragment,
    vertex as defaultVertex,
} from "../../shader/default.glsl";
import { resolveExpands, resolveIncludes } from "../../shader/Resolver";

function makeCameraUniforms(camera: Camera): { [key: string]: IUniform; } {
    const cameraUniforms: { [key: string]: IUniform; } = {};
    const { parameters, uniforms } = camera;
    for (const key in parameters) {
        if (parameters.hasOwnProperty(key)) {
            cameraUniforms[key] = { value: parameters[key] };
        }
    }
    for (const key in uniforms) {
        if (!uniforms.hasOwnProperty(key)) {
            continue;
        }

        const value = uniforms[key];
        if (value instanceof Array) {
            switch (value.length) {
                case 2:
                    cameraUniforms[key] = {
                        value: new Vector2().fromArray(value),
                    };
                    break;
                case 3:
                    cameraUniforms[key] = {
                        value: new Vector3().fromArray(value),
                    };
                    break;
                case 4:
                    cameraUniforms[key] = {
                        value: new Vector4().fromArray(value),
                    };
                    break;
                case 9:
                    cameraUniforms[key] = {
                        value: new Matrix3().fromArray(value),
                    };
                    break;
                case 16:
                    cameraUniforms[key] = {
                        value: new Matrix4().fromArray(value),
                    };
                    break;
                default:
                    throw new Error('Uniform vector of length <' + value.length + '> not supported');
            }
        } else {
            cameraUniforms[key] = { value: uniforms[key] };
        }
    }
    return cameraUniforms;
}

function resolveShader(camera: Camera, shader: string): string {
    let resolved = resolveIncludes(shader);
    resolved = resolveExpands(
        resolved,
        camera.projectToSfmFunction,
        camera.parameters,
        camera.uniforms);
    return resolved;
}

export class MeshFactory {
    private _imagePlaneDepth: number;
    private _imageSphereRadius: number;

    constructor(imagePlaneDepth?: number, imageSphereRadius?: number) {
        this._imagePlaneDepth = imagePlaneDepth != null ? imagePlaneDepth : 200;
        this._imageSphereRadius = imageSphereRadius != null ? imageSphereRadius : 200;
    }

    public createMesh(image: Image, transform: Transform): THREE.Mesh {
        if (isSpherical(transform.cameraType)) {
            return this._createImageSphere(image, transform);
        } else if (isFisheye(transform.cameraType)) {
            return this._createImagePlaneFisheye(image, transform);
        } else {
            return this._createImagePlane(image, transform);
        }
    }

    private _createImageSphere(image: Image, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(image.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createDefaultMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let mesh: THREE.Mesh = this._useMesh(transform, image) ?
            new THREE.Mesh(this._getImageSphereGeo(transform, image), material) :
            new THREE.Mesh(this._getFlatImageSphereGeo(transform), material);

        return mesh;
    }

    private _createImagePlane(image: Image, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(image.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createDefaultMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._useMesh(transform, image) ?
            this._getImagePlaneGeo(transform, image) :
            this._getRegularFlatImagePlaneGeo(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createImagePlaneFisheye(image: Image, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(image.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createDefaultMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._useMesh(transform, image) ?
            this._getImagePlaneGeoFisheye(transform, image) :
            this._getRegularFlatImagePlaneGeoFisheye(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createDefaultMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        return {
            depthWrite: false,
            fragmentShader: resolveShader(transform.camera, defaultFragment),
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                curtain: { value: 1.0 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.rt },
                projectorTex: { value: texture },
                scale_x: { value: Math.max(transform.basicHeight, transform.basicWidth) / transform.basicWidth },
                scale_y: { value: Math.max(transform.basicWidth, transform.basicHeight) / transform.basicHeight },
                ...makeCameraUniforms(transform.camera),
            },
            vertexShader: resolveShader(transform.camera, defaultVertex),
        };
    }

    private _createCurtainSphereMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        console.log(resolveShader(transform.camera, defaultFragment));
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: resolveShader(transform.camera, defaultFragment),
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                curtain: { value: 1.0 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.rt },
                projectorTex: { value: texture },
                scale_x: { value: Math.max(transform.basicHeight, transform.basicWidth) / transform.basicWidth },
                scale_y: { value: Math.max(transform.basicWidth, transform.basicHeight) / transform.basicHeight },
                ...makeCameraUniforms(transform.camera),
            },
            vertexShader: resolveShader(transform.camera, defaultVertex),
        };

        return materialParameters;
    }

    private _createTexture(image: HTMLImageElement): THREE.Texture {
        let texture: THREE.Texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return texture;
    }

    private _useMesh(transform: Transform, image: Image): boolean {
        return image.mesh.vertices.length && transform.hasValidScale;
    }

    private _getImageSphereGeo(transform: Transform, image: Image): THREE.BufferGeometry {
        const t = transform.srtInverse;

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imageSphereRadius * transform.scale;

        let vertices: number[] = image.mesh.vertices;
        let numVertices: number = vertices.length / 3;
        let positions: Float32Array = new Float32Array(vertices.length);
        for (let i: number = 0; i < numVertices; ++i) {
            let index: number = 3 * i;
            let x: number = vertices[index + 0];
            let y: number = vertices[index + 1];
            let z: number = vertices[index + 2];

            let l: number = Math.sqrt(x * x + y * y + z * z);
            let boundedL: number = Math.max(minZ, Math.min(l, maxZ));
            let factor: number = boundedL / l;
            let p: THREE.Vector3 = new THREE.Vector3(x * factor, y * factor, z * factor);

            p.applyMatrix4(t);

            positions[index + 0] = p.x;
            positions[index + 1] = p.y;
            positions[index + 2] = p.z;
        }

        let faces: number[] = image.mesh.faces;
        let indices: Uint16Array = new Uint16Array(faces.length);
        for (let i: number = 0; i < faces.length; ++i) {
            indices[i] = faces[i];
        }

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }

    private _getImagePlaneGeo(transform: Transform, image: Image): THREE.BufferGeometry {
        const undistortionMarginFactor: number = 3;
        const t = transform.srtInverse;

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imagePlaneDepth * transform.scale;

        let vertices: number[] = image.mesh.vertices;
        let numVertices: number = vertices.length / 3;
        let positions: Float32Array = new Float32Array(vertices.length);
        for (let i: number = 0; i < numVertices; ++i) {
            let index: number = 3 * i;
            let x: number = vertices[index + 0];
            let y: number = vertices[index + 1];
            let z: number = vertices[index + 2];

            if (i < 4) {
                x *= undistortionMarginFactor;
                y *= undistortionMarginFactor;
            }

            let boundedZ: number = Math.max(minZ, Math.min(z, maxZ));
            let factor: number = boundedZ / z;
            let p: THREE.Vector3 = new THREE.Vector3(x * factor, y * factor, boundedZ);

            p.applyMatrix4(t);

            positions[index + 0] = p.x;
            positions[index + 1] = p.y;
            positions[index + 2] = p.z;
        }

        let faces: number[] = image.mesh.faces;
        let indices: Uint16Array = new Uint16Array(faces.length);
        for (let i: number = 0; i < faces.length; ++i) {
            indices[i] = faces[i];
        }

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }

    private _getImagePlaneGeoFisheye(transform: Transform, image: Image): THREE.BufferGeometry {
        const t = transform.srtInverse;

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imagePlaneDepth * transform.scale;

        let vertices: number[] = image.mesh.vertices;
        let numVertices: number = vertices.length / 3;
        let positions: Float32Array = new Float32Array(vertices.length);
        for (let i: number = 0; i < numVertices; ++i) {
            let index: number = 3 * i;
            let x: number = vertices[index + 0];
            let y: number = vertices[index + 1];
            let z: number = vertices[index + 2];

            let l: number = Math.sqrt(x * x + y * y + z * z);
            let boundedL: number = Math.max(minZ, Math.min(l, maxZ));
            let factor: number = boundedL / l;
            let p: THREE.Vector3 = new THREE.Vector3(x * factor, y * factor, z * factor);

            p.applyMatrix4(t);

            positions[index + 0] = p.x;
            positions[index + 1] = p.y;
            positions[index + 2] = p.z;
        }

        let faces: number[] = image.mesh.faces;
        let indices: Uint16Array = new Uint16Array(faces.length);
        for (let i: number = 0; i < faces.length; ++i) {
            indices[i] = faces[i];
        }

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }

    private _getFlatImageSphereGeo(transform: Transform): THREE.BufferGeometry {
        const geometry =
            new THREE.SphereGeometry(this._imageSphereRadius, 20, 40);
        const t = transform.rt
            .clone()
            .invert();
        geometry.applyMatrix4(t);
        return geometry;
    }

    private _getRegularFlatImagePlaneGeo(transform: Transform): THREE.BufferGeometry {
        let width: number = transform.width;
        let height: number = transform.height;
        let size: number = Math.max(width, height);
        let dx: number = width / 2.0 / size;
        let dy: number = height / 2.0 / size;

        return this._getFlatImagePlaneGeo(transform, dx, dy);
    }

    private _getFlatImagePlaneGeo(transform: Transform, dx: number, dy: number): THREE.BufferGeometry {
        let vertices: number[][] = [];
        vertices.push(transform.unprojectSfM([-dx, -dy], this._imagePlaneDepth));
        vertices.push(transform.unprojectSfM([dx, -dy], this._imagePlaneDepth));
        vertices.push(transform.unprojectSfM([dx, dy], this._imagePlaneDepth));
        vertices.push(transform.unprojectSfM([-dx, dy], this._imagePlaneDepth));

        return this._createFlatGeometry(vertices);
    }

    private _getRegularFlatImagePlaneGeoFisheye(transform: Transform): THREE.BufferGeometry {
        let width: number = transform.width;
        let height: number = transform.height;
        let size: number = Math.max(width, height);
        let dx: number = width / 2.0 / size;
        let dy: number = height / 2.0 / size;

        return this._getFlatImagePlaneGeoFisheye(transform, dx, dy);
    }

    private _getFlatImagePlaneGeoFisheye(transform: Transform, dx: number, dy: number): THREE.BufferGeometry {
        let vertices: number[][] = [];
        vertices.push(transform.unprojectSfM([-dx, -dy], this._imagePlaneDepth));
        vertices.push(transform.unprojectSfM([dx, -dy], this._imagePlaneDepth));
        vertices.push(transform.unprojectSfM([dx, dy], this._imagePlaneDepth));
        vertices.push(transform.unprojectSfM([-dx, dy], this._imagePlaneDepth));

        return this._createFlatGeometry(vertices);
    }

    private _createFlatGeometry(vertices: number[][]): THREE.BufferGeometry {
        let positions: Float32Array = new Float32Array(12);
        for (let i: number = 0; i < vertices.length; i++) {
            let index: number = 3 * i;
            positions[index + 0] = vertices[i][0];
            positions[index + 1] = vertices[i][1];
            positions[index + 2] = vertices[i][2];
        }

        let indices: Uint16Array = new Uint16Array(6);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 3;
        indices[3] = 1;
        indices[4] = 2;
        indices[5] = 3;

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }
}
