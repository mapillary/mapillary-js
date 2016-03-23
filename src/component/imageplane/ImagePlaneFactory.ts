/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {IGPano} from "../../API";
import {Transform} from "../../Geo";
import {Node} from "../../Graph";
import {ImagePlaneShaders} from "../../Component";

export class ImagePlaneFactory {
    private _imagePlaneDepth: number;
    private _imageSphereRadius: number;

    constructor(imagePlaneDepth?: number, imageSphereRadius?: number) {
        this._imagePlaneDepth = imagePlaneDepth != null ? imagePlaneDepth : 200;
        this._imageSphereRadius = imageSphereRadius != null ? imageSphereRadius : 200;
    }

    public createMesh(node: Node, transform: Transform): THREE.Mesh {
        let mesh: THREE.Mesh = node.pano ?
            this._createImageSphere(node, transform) :
            this._createImagePlane(node, transform);

        return mesh;
    }

    private _createImageSphere(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createSphereMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);
        let geometry: THREE.Geometry = this._getImageSphereGeo(transform, node);
        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    private _createImagePlane(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createPlaneMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);
        let geometry: THREE.Geometry = this._getImagePlaneGeo(transform, node);
        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    private _createSphereMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let gpano: IGPano = transform.gpano;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;

        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: ImagePlaneShaders.equirectangular.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                opacity: {
                    type: "f",
                    value: 1,
                },
                phiLength: {
                    type: "f",
                    value: phiLength,
                },
                projectorMat: {
                    type: "m4",
                    value: transform.rt,
                },
                projectorTex: {
                    type: "t",
                    value: texture,
                },
                thetaLength: {
                    type: "f",
                    value: thetaLength,
                },
            },
            vertexShader: ImagePlaneShaders.equirectangular.vertex,
        };

        return materialParameters;
    }

    private _createPlaneMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: ImagePlaneShaders.perspective.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                bbox: {
                    type: "v4",
                    value: new THREE.Vector4(0, 0, 1, 1),
                },
                opacity: {
                    type: "f",
                    value: 1,
                },
                projectorMat: {
                    type: "m4",
                    value: transform.projectorMatrix(),
                },
                projectorTex: {
                    type: "t",
                    value: texture,
                },
            },
            vertexShader: ImagePlaneShaders.perspective.vertex,
        };

        return materialParameters;
    }

    private _createTexture(image: HTMLImageElement): THREE.Texture {
        let texture: THREE.Texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return texture;
    }

    private _getImageSphereGeo(transform: Transform, node: Node): THREE.Geometry {
        if (!node.mesh.vertices.length ||
            transform.scale < 1e-2 ||
            transform.scale > 50) {
            return this._getFlatImageSphereGeo(transform);
        }

        let geometry: THREE.Geometry = new THREE.Geometry();
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imageSphereRadius * transform.scale;

        let vertices: number[] = node.mesh.vertices;
        let numVertices: number = vertices.length / 3;
        for (let i: number = 0; i < numVertices; ++i) {
            let x: number = vertices[3 * i + 0];
            let y: number = vertices[3 * i + 1];
            let z: number = vertices[3 * i + 2];

            let l: number = Math.sqrt(x * x + y * y + z * z);
            let boundedL: number = Math.max(minZ, Math.min(l, maxZ));
            let factor: number = boundedL / l;
            let p: THREE.Vector3 = new THREE.Vector3(x * factor, y * factor, z * factor);

            p.applyMatrix4(t);
            geometry.vertices.push(p);
        }

        let faces: number[] = node.mesh.faces;
        let numFaces: number = faces.length / 3;
        for (let i: number = 0; i < numFaces; ++i) {
            geometry.faces.push(
                new THREE.Face3(
                    faces[3 * i + 0],
                    faces[3 * i + 1],
                    faces[3 * i + 2]
                ));
        }

        return geometry;
    }

    private _getImagePlaneGeo(transform: Transform, node: Node): THREE.Geometry {
        if (!node.mesh.vertices.length ||
            transform.scale < 1e-2 ||
            transform.scale > 50) {
            return this._getFlatImagePlaneGeo(transform);
        }

        let geometry: THREE.Geometry = new THREE.Geometry();
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imagePlaneDepth * transform.scale;

        let vertices: number[] = node.mesh.vertices;
        let numVertices: number = vertices.length / 3;
        for (let i: number = 0; i < numVertices; ++i) {
            let x: number = vertices[3 * i + 0];
            let y: number = vertices[3 * i + 1];
            let z: number = vertices[3 * i + 2];

            let boundedZ: number = Math.max(minZ, Math.min(z, maxZ));
            let factor: number = boundedZ / z;
            let p: THREE.Vector3 = new THREE.Vector3(x * factor, y * factor, boundedZ);

            p.applyMatrix4(t);
            geometry.vertices.push(p);
        }

        let faces: number[] = node.mesh.faces;
        let numFaces: number = faces.length / 3;
        for (let i: number = 0; i < numFaces; ++i) {
            geometry.faces.push(
                new THREE.Face3(
                    faces[3 * i + 0],
                    faces[3 * i + 1],
                    faces[3 * i + 2]
                ));
        }

        return geometry;
    }

    private _getFlatImageSphereGeo(transform: Transform): THREE.Geometry {
        let gpano: IGPano = transform.gpano;
        let phiStart: number = 2 * Math.PI * gpano.CroppedAreaLeftPixels / gpano.FullPanoWidthPixels;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;
        let thetaStart: number = Math.PI * gpano.CroppedAreaTopPixels / gpano.FullPanoHeightPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;
        let geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
            this._imageSphereRadius,
            20,
            40,
            phiStart - Math.PI / 2,
            phiLength,
            thetaStart,
            thetaLength
        );

        geometry.applyMatrix(new THREE.Matrix4().getInverse(transform.rt));

        return geometry;
    }

    private _getFlatImagePlaneGeo(transform: Transform): THREE.Geometry {
        let width: number = transform.width;
        let height: number = transform.height;
        let size: number = Math.max(width, height);
        let dx: number = width / 2.0 / size;
        let dy: number = height / 2.0 / size;
        let tl: THREE.Vector3 = transform.pixelToVertex(-dx, -dy, this._imagePlaneDepth);
        let tr: THREE.Vector3 = transform.pixelToVertex( dx, -dy, this._imagePlaneDepth);
        let br: THREE.Vector3 = transform.pixelToVertex( dx, dy, this._imagePlaneDepth);
        let bl: THREE.Vector3 = transform.pixelToVertex(-dx, dy, this._imagePlaneDepth);

        let geometry: THREE.Geometry = new THREE.Geometry();

        geometry.vertices.push(tl, bl, br, tr);
        geometry.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3));

        return geometry;
    }
}

export default ImagePlaneFactory;
