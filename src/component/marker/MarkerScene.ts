import * as THREE from "three";

import {ILatLon} from "../../API";
import {Marker} from "../../Component";

export class MarkerScene {
    private _needsRender: boolean;
    private _interactiveObjects: THREE.Object3D[];
    private _markers: { [key: string]: Marker };
    private _objectMarkers: { [id: string]: string };
    private _raycaster: THREE.Raycaster;
    private _scene: THREE.Scene;

    constructor(scene?: THREE.Scene, raycaster?: THREE.Raycaster) {
        this._needsRender = false;
        this._interactiveObjects = [];
        this._markers = {};
        this._objectMarkers = {};
        this._raycaster = !!raycaster ? raycaster : new THREE.Raycaster();
        this._scene = !!scene ? scene : new THREE.Scene();
    }

    public get markers(): { [key: string]: Marker } {
        return this._markers;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public add(marker: Marker, position: number[]): void {
        if (marker.id in this._markers) {
            this._dispose(marker.id);
        }

        marker.createGeometry(position);
        this._scene.add(marker.geometry);
        this._markers[marker.id] = marker;
        for (let interactiveObject of marker.getInteractiveObjects()) {
            this._interactiveObjects.push(interactiveObject);
            this._objectMarkers[interactiveObject.uuid] = marker.id;
        }

        this._needsRender = true;
    }

    public clear(): void {
        for (const id in this._markers) {
            if (!this._markers.hasOwnProperty) {
                continue;
            }

            this._dispose(id);
        }

        this._needsRender = true;
    }

    public get(id: string): Marker {
        return this._markers[id];
    }

    public getAll(): Marker[] {
        return Object
            .keys(this._markers)
            .map((id: string): Marker => { return this._markers[id]; });
    }

    public has(id: string): boolean {
        return id in this._markers;
    }

    public intersectObjects([viewportX, viewportY]: number[], camera: THREE.Camera): string {
        this._raycaster.setFromCamera(new THREE.Vector2(viewportX, viewportY), camera);

        const intersects: THREE.Intersection[] = this._raycaster.intersectObjects(this._interactiveObjects);
        for (const intersect of intersects) {
            if (intersect.object.uuid in this._objectMarkers) {
                return this._objectMarkers[intersect.object.uuid];
            }
        }

        return null;
    }

    public lerpAltitude(id: string, alt: number, alpha: number): void {
        if (!(id in this._markers)) {
            return;
        }

        this._markers[id].lerpAltitude(alt, alpha);

        this._needsRender = true;
    }

    public remove(id: string): void {
        if (!(id in this._markers)) {
            return;
        }

        this._dispose(id);

        this._needsRender = true;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    public update(id: string, position: number[], latLon?: ILatLon): void {
        if (!(id in this._markers)) {
            return;
        }

        const marker: Marker = this._markers[id];
        marker.updatePosition(position, latLon);

        this._needsRender = true;
    }

    private _dispose(id: string): void {
        const marker: Marker = this._markers[id];
        this._scene.remove(marker.geometry);
        for (let interactiveObject of marker.getInteractiveObjects()) {
            const index: number = this._interactiveObjects.indexOf(interactiveObject);
            if (index !== -1) {
                this._interactiveObjects.splice(index, 1);
            } else {
                console.warn(`Object does not exist (${interactiveObject.id}) for ${id}`);
            }

            delete this._objectMarkers[interactiveObject.uuid];
        }

        marker.disposeGeometry();

        delete this._markers[id];
    }
}

export default MarkerScene;
