import * as THREE from "three";

import {IGPano} from "../../API";
import {Transform} from "../../Geo";
import {Node} from "../../Graph";
import {Shaders} from "../../Component";

export class MeshFactory {
    private _imagePlaneDepth: number;
    private _imageSphereRadius: number;

    constructor(imagePlaneDepth?: number, imageSphereRadius?: number) {
        this._imagePlaneDepth = imagePlaneDepth != null ? imagePlaneDepth : 200;
        this._imageSphereRadius = imageSphereRadius != null ? imageSphereRadius : 200;
    }

    public createMesh(node: Node, transform: Transform): THREE.Mesh {
        if (node.pano) {
            return this._createImageSphere(node, transform);
        } else if (transform.cameraProjection === "fisheye") {
            return this._createImagePlaneFisheye(node, transform);
        } else {
            return this._createImagePlane(node, transform);
        }
    }

    public createFlatMesh(
        node: Node,
        transform: Transform,
        basicX0: number,
        basicX1: number,
        basicY0: number,
        basicY1: number): THREE.Mesh {

        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters =
            this._createDistortedPlaneMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._getFlatImagePlaneGeoFromBasic(transform, basicX0, basicX1, basicY0, basicY1);

        return new THREE.Mesh(geometry, material);
    }

    public createCurtainMesh(node: Node, transform: Transform): THREE.Mesh {
        if (node.pano && !node.fullPano) {
            throw new Error("Cropped panoramas cannot have curtain.");
        }

        if (node.pano) {
            return this._createSphereCurtainMesh(node, transform);
        } else if (transform.cameraProjection === "fisheye") {
            return this._createCurtainMeshFisheye(node, transform);
        } else {
            return this._createCurtainMesh(node, transform);
        }
    }

    public createDistortedCurtainMesh(node: Node, transform: Transform): THREE.Mesh {
        if (node.pano) {
            throw new Error("Cropped panoramas cannot have curtain.");
        }

        return this._createDistortedCurtainMesh(node, transform);
    }

    private _createCurtainMesh(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters =
            this._createCurtainPlaneMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._useMesh(transform, node) ?
            this._getImagePlaneGeo(transform, node) :
            this._getRegularFlatImagePlaneGeo(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createCurtainMeshFisheye(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters =
            this._createCurtainPlaneMaterialParametersFisheye(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._useMesh(transform, node) ?
            this._getImagePlaneGeoFisheye(transform, node) :
            this._getRegularFlatImagePlaneGeo(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createDistortedCurtainMesh(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters =
            this._createDistortedCurtainPlaneMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._getRegularFlatImagePlaneGeo(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createSphereCurtainMesh(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters =
            this._createCurtainSphereMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        return this._useMesh(transform, node) ?
            new THREE.Mesh(this._getImageSphereGeo(transform, node), material) :
            new THREE.Mesh(this._getFlatImageSphereGeo(transform), material);
    }

    private _createImageSphere(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createSphereMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let mesh: THREE.Mesh = this._useMesh(transform, node) ?
            new THREE.Mesh(this._getImageSphereGeo(transform, node), material) :
            new THREE.Mesh(this._getFlatImageSphereGeo(transform), material);

        return mesh;
    }

    private _createImagePlane(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createPlaneMaterialParameters(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._useMesh(transform, node) ?
            this._getImagePlaneGeo(transform, node) :
            this._getRegularFlatImagePlaneGeo(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createImagePlaneFisheye(node: Node, transform: Transform): THREE.Mesh {
        let texture: THREE.Texture = this._createTexture(node.image);
        let materialParameters: THREE.ShaderMaterialParameters = this._createPlaneMaterialParametersFisheye(transform, texture);
        let material: THREE.ShaderMaterial = new THREE.ShaderMaterial(materialParameters);

        let geometry: THREE.BufferGeometry = this._useMesh(transform, node) ?
            this._getImagePlaneGeoFisheye(transform, node) :
            this._getRegularFlatImagePlaneGeoFisheye(transform);

        return new THREE.Mesh(geometry, material);
    }

    private _createSphereMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let gpano: IGPano = transform.gpano;

        let halfCroppedWidth: number = (gpano.FullPanoWidthPixels - gpano.CroppedAreaImageWidthPixels) / 2;
        let phiShift: number = 2 * Math.PI * (gpano.CroppedAreaLeftPixels - halfCroppedWidth) / gpano.FullPanoWidthPixels;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;

        let halfCroppedHeight: number = (gpano.FullPanoHeightPixels - gpano.CroppedAreaImageHeightPixels) / 2;
        let thetaShift: number = Math.PI * (halfCroppedHeight - gpano.CroppedAreaTopPixels) / gpano.FullPanoHeightPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;

        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.equirectangular.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                opacity: { value: 1.0 },
                phiLength: { value: phiLength },
                phiShift: { value: phiShift },
                projectorMat: { value: transform.rt },
                projectorTex: { value: texture },
                thetaLength: { value: thetaLength },
                thetaShift: { value: thetaShift },
            },
            vertexShader: Shaders.equirectangular.vertex,
        };

        return materialParameters;
    }

    private _createCurtainSphereMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let gpano: IGPano = transform.gpano;

        let halfCroppedWidth: number = (gpano.FullPanoWidthPixels - gpano.CroppedAreaImageWidthPixels) / 2;
        let phiShift: number = 2 * Math.PI * (gpano.CroppedAreaLeftPixels - halfCroppedWidth) / gpano.FullPanoWidthPixels;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;

        let halfCroppedHeight: number = (gpano.FullPanoHeightPixels - gpano.CroppedAreaImageHeightPixels) / 2;
        let thetaShift: number = Math.PI * (halfCroppedHeight - gpano.CroppedAreaTopPixels) / gpano.FullPanoHeightPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;

        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.equirectangularCurtain.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                curtain: { value: 1.0 },
                opacity: { value: 1.0 },
                phiLength: { value: phiLength },
                phiShift: { value: phiShift },
                projectorMat: { value: transform.rt },
                projectorTex: { value: texture },
                thetaLength: { value: thetaLength },
                thetaShift: { value: thetaShift },
            },
            vertexShader: Shaders.equirectangularCurtain.vertex,
        };

        return materialParameters;
    }

    private _createPlaneMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.perspective.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                focal: { value: transform.focal },
                k1: { value: transform.ck1 },
                k2: { value: transform.ck2 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.basicRt },
                projectorTex: { value: texture },
                radial_peak: { value: !!transform.radialPeak ? transform.radialPeak : 0.0 },
                scale_x: { value: Math.max(transform.basicHeight, transform.basicWidth) / transform.basicWidth },
                scale_y: { value: Math.max(transform.basicWidth, transform.basicHeight) / transform.basicHeight },
            },
            vertexShader: Shaders.perspective.vertex,
        };

        return materialParameters;
    }

    private _createPlaneMaterialParametersFisheye(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.fisheye.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                focal: { value: transform.focal },
                k1: { value: transform.ck1 },
                k2: { value: transform.ck2 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.basicRt },
                projectorTex: { value: texture },
                radial_peak: { value: !!transform.radialPeak ? transform.radialPeak : 0.0 },
                scale_x: { value: Math.max(transform.basicHeight, transform.basicWidth) / transform.basicWidth },
                scale_y: { value: Math.max(transform.basicWidth, transform.basicHeight) / transform.basicHeight },
            },
            vertexShader: Shaders.fisheye.vertex,
        };

        return materialParameters;
    }

    private _createCurtainPlaneMaterialParametersFisheye(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.fisheyeCurtain.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                curtain: { value: 1.0 },
                focal: { value: transform.focal },
                k1: { value: transform.ck1 },
                k2: { value: transform.ck2 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.basicRt },
                projectorTex: { value: texture },
                radial_peak: { value: !!transform.radialPeak ? transform.radialPeak : 0.0 },
                scale_x: { value: Math.max(transform.basicHeight, transform.basicWidth) / transform.basicWidth },
                scale_y: { value: Math.max(transform.basicWidth, transform.basicHeight) / transform.basicHeight },
            },
            vertexShader: Shaders.fisheyeCurtain.vertex,
        };

        return materialParameters;
    }

    private _createCurtainPlaneMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.perspectiveCurtain.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                curtain: { value: 1.0 },
                focal: { value: transform.focal },
                k1: { value: transform.ck1 },
                k2: { value: transform.ck2 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.basicRt },
                projectorTex: { value: texture },
                radial_peak: { value: !!transform.radialPeak ? transform.radialPeak : 0.0 },
                scale_x: { value: Math.max(transform.basicHeight, transform.basicWidth) / transform.basicWidth },
                scale_y: { value: Math.max(transform.basicWidth, transform.basicHeight) / transform.basicHeight },
            },
            vertexShader: Shaders.perspectiveCurtain.vertex,
        };

        return materialParameters;
    }

    private _createDistortedCurtainPlaneMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.perspectiveDistortedCurtain.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                curtain: { value: 1.0 },
                opacity: { value: 1.0 },
                projectorMat: { value: transform.projectorMatrix() },
                projectorTex: { value: texture },
            },
            vertexShader: Shaders.perspectiveDistortedCurtain.vertex,
        };

        return materialParameters;
    }

    private _createDistortedPlaneMaterialParameters(transform: Transform, texture: THREE.Texture): THREE.ShaderMaterialParameters {
        let materialParameters: THREE.ShaderMaterialParameters = {
            depthWrite: false,
            fragmentShader: Shaders.perspectiveDistorted.fragment,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                opacity: { value: 1.0 },
                projectorMat: { value: transform.projectorMatrix() },
                projectorTex: { value: texture },
            },
            vertexShader: Shaders.perspectiveDistorted.vertex,
        };

        return materialParameters;
    }

    private _createTexture(image: HTMLImageElement): THREE.Texture {
        let texture: THREE.Texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return texture;
    }

    private _useMesh(transform: Transform, node: Node): boolean {
        return node.mesh.vertices.length && transform.hasValidScale;
    }

    private _getImageSphereGeo(transform: Transform, node: Node): THREE.BufferGeometry {
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imageSphereRadius * transform.scale;

        let vertices: number[] = node.mesh.vertices;
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

        let faces: number[] = node.mesh.faces;
        let indices: Uint16Array = new Uint16Array(faces.length);
        for (let i: number = 0; i < faces.length; ++i) {
            indices[i] = faces[i];
        }

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }

    private _getImagePlaneGeo(transform: Transform, node: Node): THREE.BufferGeometry {
        const undistortionMarginFactor: number = 3;
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imagePlaneDepth * transform.scale;

        let vertices: number[] = node.mesh.vertices;
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

        let faces: number[] = node.mesh.faces;
        let indices: Uint16Array = new Uint16Array(faces.length);
        for (let i: number = 0; i < faces.length; ++i) {
            indices[i] = faces[i];
        }

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }

    private _getImagePlaneGeoFisheye(transform: Transform, node: Node): THREE.BufferGeometry {
        let t: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);

        // push everything at least 5 meters in front of the camera
        let minZ: number = 5.0 * transform.scale;
        let maxZ: number = this._imagePlaneDepth * transform.scale;

        let vertices: number[] = node.mesh.vertices;
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

        let faces: number[] = node.mesh.faces;
        let indices: Uint16Array = new Uint16Array(faces.length);
        for (let i: number = 0; i < faces.length; ++i) {
            indices[i] = faces[i];
        }

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        return geometry;
    }

    private _getFlatImageSphereGeo(transform: Transform): THREE.Geometry {
        let gpano: IGPano = transform.gpano;
        let phiStart: number = 2 * Math.PI * gpano.CroppedAreaLeftPixels / gpano.FullPanoWidthPixels;
        let phiLength: number = 2 * Math.PI * gpano.CroppedAreaImageWidthPixels / gpano.FullPanoWidthPixels;
        let thetaStart: number = Math.PI *
            (gpano.FullPanoHeightPixels - gpano.CroppedAreaImageHeightPixels - gpano.CroppedAreaTopPixels) /
            gpano.FullPanoHeightPixels;
        let thetaLength: number = Math.PI * gpano.CroppedAreaImageHeightPixels / gpano.FullPanoHeightPixels;
        let geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
            this._imageSphereRadius,
            20,
            40,
            phiStart - Math.PI / 2,
            phiLength,
            thetaStart,
            thetaLength);

        geometry.applyMatrix4(new THREE.Matrix4().getInverse(transform.rt));

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

    private _getFlatImagePlaneGeoFromBasic(
        transform: Transform,
        basicX0: number,
        basicX1: number,
        basicY0: number,
        basicY1: number): THREE.BufferGeometry {

        let vertices: number[][] = [];

        vertices.push(transform.unprojectBasic([basicX0, basicY0], this._imagePlaneDepth));
        vertices.push(transform.unprojectBasic([basicX1, basicY0], this._imagePlaneDepth));
        vertices.push(transform.unprojectBasic([basicX1, basicY1], this._imagePlaneDepth));
        vertices.push(transform.unprojectBasic([basicX0, basicY1], this._imagePlaneDepth));

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

export default MeshFactory;
