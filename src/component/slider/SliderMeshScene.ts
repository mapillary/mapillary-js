import { Material, Mesh, Scene, Texture } from "three";
import { ICamera } from "../../geometry/interfaces/ICamera";
import { ProjectorShaderMaterial } from "../image/interfaces/ProjectorShaderMaterial";

export type SliderMeshSceneItem = {
    camera: ICamera;
    imageId: string;
    mesh: Mesh;
};

export class SliderMeshScene {
    private _planes: SliderMeshSceneItem[];
    private _planesOld: SliderMeshSceneItem[];
    private _planesPeriphery: SliderMeshSceneItem[];

    private _scene: Scene;
    private _sceneOld: Scene;
    private _scenePeriphery: Scene;

    constructor() {
        this._planes = [];
        this._planesOld = [];
        this._planesPeriphery = [];

        this._scene = new Scene();
        this._sceneOld = new Scene();
        this._scenePeriphery = new Scene();
    }

    public get planes(): SliderMeshSceneItem[] {
        return this._planes;
    }

    public get planesOld(): SliderMeshSceneItem[] {
        return this._planesOld;
    }

    public get planesPeriphery(): SliderMeshSceneItem[] {
        return this._planesPeriphery;
    }

    public get scene(): Scene {
        return this._scene;
    }

    public get sceneOld(): Scene {
        return this._sceneOld;
    }

    public get scenePeriphery(): Scene {
        return this._scenePeriphery;
    }

    public updateImagePlanes(planes: SliderMeshSceneItem[]): void {
        this._dispose(this._planesOld, this.sceneOld);

        for (const plane of this._planes) {
            this._scene.remove(plane.mesh);
            this._sceneOld.add(plane.mesh);
        }

        for (const plane of planes) {
            this._scene.add(plane.mesh);
        }

        this._planesOld = this._planes;
        this._planes = planes;
    }

    public addImagePlanes(planes: SliderMeshSceneItem[]): void {
        for (const plane of planes) {
            this._scene.add(plane.mesh);
            this._planes.push(plane);
        }
    }

    public addImagePlanesOld(planes: SliderMeshSceneItem[]): void {
        for (const plane of planes) {
            this._sceneOld.add(plane.mesh);
            this._planesOld.push(plane);
        }
    }

    public setImagePlanes(planes: SliderMeshSceneItem[]): void {
        this._clear();
        this.addImagePlanes(planes);
    }

    public addPeripheryPlanes(planes: SliderMeshSceneItem[]): void {
        for (const plane of planes) {
            this._scenePeriphery.add(plane.mesh);
            this._planesPeriphery.push(plane);
        }
    }

    public setPeripheryPlanes(planes: SliderMeshSceneItem[]): void {
        this._clearPeriphery();
        this.addPeripheryPlanes(planes);
    }

    public setImagePlanesOld(planes: SliderMeshSceneItem[]): void {
        this._clearOld();
        this.addImagePlanesOld(planes);
    }

    public clear(): void {
        this._clear();
        this._clearOld();
    }

    private _clear(): void {
        this._dispose(this._planes, this._scene);
        this._planes = [];
    }

    private _clearOld(): void {
        this._dispose(this._planesOld, this._sceneOld);
        this._planesOld = [];
    }

    private _clearPeriphery(): void {
        this._dispose(this._planesPeriphery, this._scenePeriphery);
        this._planesPeriphery = [];
    }

    private _dispose(planes: SliderMeshSceneItem[], scene: Scene): void {
        for (const plane of planes) {
            const { mesh } = plane;
            scene.remove(mesh);
            mesh.geometry.dispose();
            (<Material>mesh.material).dispose();
            const texture: Texture =
                (<ProjectorShaderMaterial>mesh.material)
                    .uniforms.projectorTex.value;
            if (texture != null) {
                texture.dispose();
            }
        }
    }
}
