/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {ComponentService, Component} from "../Component";
import {IFrame, ICurrentState} from "../State";
import {Camera} from "../Geo";
import {Container, Navigator} from "../Viewer";
import {IGLRenderHash, GLRenderStage, IGLRenderFunction} from "../Render";
import {Node} from "../Graph";

export class SphereComponent extends Component {
    public static componentName: string = "sphere";
    private _disposable: rx.IDisposable;

    private _scene: THREE.Scene;
    private _sphere: THREE.Mesh;

    private _key: string;
    private _alpha: number;
    private _camera: Camera;

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        // initialize scene specific properties.
        this._scene = new THREE.Scene();
        this._key = "";
        this._alpha = 0;
        this._camera = new Camera();

        let render: IGLRenderFunction = this._render.bind(this);

        // subscribe to current state - updates will arrive for each
        // requested frame.
        this._disposable = this._navigator.stateService.currentState$
            .map<IGLRenderHash>((frame: IFrame): IGLRenderHash => {
                let state: ICurrentState = frame.state;

                // determine if render is needed while updating scene
                // specific properies.
                let needsRender: boolean = this._updateAlpha(state.alpha);
                needsRender = this._updateSphere(state.camera, state.currentNode) || needsRender;

                // return render hash with render function and
                // render in foreground.
                return {
                    name: this._name,
                    render: {
                        frameId: frame.id,
                        needsRender: needsRender,
                        render: render,
                        stage: GLRenderStage.Foreground,
                    },
                };
            })
            .subscribe(this._container.glRenderer.render$);
    }

    protected _deactivate(): void {
        // release memory
        this._disposeSphere();
        this._disposable.dispose();
    }

    private _updateAlpha(alpha: number): boolean {
        // we depend on alpha for sphere opacity so save it in internal state.
        if (alpha === this._alpha) {
            return false;
        }

        this._alpha = alpha;

        return true;
    }

    private _updateSphere(camera: Camera, node: Node): boolean {
        if (node == null || node.key === this._key) {
            // return if node has not changed.
            return false;
        }

        this._key = node.key;

        // dispose the old sphere.
        this._disposeSphere();

        // create a new sphere for each new node and place
        // it 10 meters in front of the current camera.
        let position: THREE.Vector3 =
            camera.lookat.clone().sub(camera.position).normalize().multiplyScalar(10).add(camera.lookat);

        this._sphere = this._createSphere();
        this._sphere.position.copy(position);

        this._scene.add(this._sphere);
    }

    private _render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        // update opacity according to last alpha and render sphere scene.
        if (this._sphere != null) {
            this._sphere.material.opacity = this._alpha > 0.5 ? this._alpha : 1 - this._alpha;
        }

        renderer.render(this._scene, perspectiveCamera);
    }

    private _createSphere(): THREE.Mesh {
        // create a mesh with spherical geometry.
        let geometry: THREE.SphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);

        let color: THREE.Color = new THREE.Color(
            Math.round(Math.random()),
            Math.round(Math.random()),
            Math.round(Math.random()));

        let material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(
            { color: color.getHex(), depthWrite: true, transparent: true });

        let sphere: THREE.Mesh = new THREE.Mesh(geometry, material);

        return sphere;
    }

    private _disposeSphere(): void {
        if (this._sphere != null) {
            this._scene.remove(this._sphere);
            this._sphere.geometry.dispose();
            this._sphere.material.dispose();
            this._sphere = null;
        }
    }
}

ComponentService.register(SphereComponent);
export default SphereComponent;
