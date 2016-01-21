/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {IUI} from "../UI";
import {IFrame, ICurrentState} from "../State";
import {Camera} from "../Geo";
import {Container, Navigator} from "../Viewer";
import {IGLRenderHash, GLRenderStage} from "../Render";
import {Node} from "../Graph";

export class SphereUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    private stateSubscription: rx.IDisposable;

    private name: string;

    private scene: THREE.Scene;
    private sphere: THREE.Mesh;

    private key: string;
    private alpha: number;
    private camera: Camera;

    constructor (container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;

        // give our UI a unique name.
        this.name = "sphere";
    }

    public activate(): void {
        // initialize scene specific properties.
        this.scene = new THREE.Scene();
        this.key = "";
        this.alpha = 0;
        this.camera = new Camera();

        // subscribe to current state - updates will arrive for each
        // requested frame.
        this.stateSubscription = this.navigator.stateService.currentState$
            .map<IGLRenderHash>((frame: IFrame): IGLRenderHash => {
                let state: ICurrentState = frame.state;

                // determine if render is needed while updating scene
                // specific properies.
                let needsRender: boolean = this.updateAlpha(state.alpha);
                needsRender = this.updateSphere(state.camera, state.currentNode) || needsRender;

                // return render hash with render function and
                // render in foreground.
                return {
                    name: this.name,
                    render: {
                        frameId: frame.id,
                        needsRender: needsRender,
                        render: this.render.bind(this),
                        stage: GLRenderStage.FOREGROUND,
                    },
                };
            })
            .subscribe(this.container.glRenderer.render$);
    }

    public deactivate(): void {
        // clear this UI from the rendering pipeline to ensure
        // does not stall.
        this.container.glRenderer.clear(this.name);
        this.stateSubscription.dispose();
    }

    private updateAlpha(alpha: number): boolean {
        // we depend on alpha for sphere opacity so save it in internal state.
        if (alpha === this.alpha) {
            return false;
        }

        this.alpha = alpha;

        return true;
    }

    private updateSphere(camera: Camera, node: Node): boolean {
        if (node == null || node.key === this.key) {
            // return if node has not changed.
            return false;
        }

        this.key = node.key;

        if (this.sphere != null) {
            // dispose the old sphere.
            this.scene.remove(this.sphere);
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
            this.sphere = null;
        }

        // create a new sphere for each new node and place
        // it 10 meters in front of the current camera.
        let position: THREE.Vector3 =
            camera.lookat.clone().sub(camera.position).normalize().multiplyScalar(10).add(camera.lookat);

        this.sphere = this.createSphere();
        this.sphere.position.copy(position);

        this.scene.add(this.sphere);
    }

    private render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        // update opacity according to last alpha and render sphere scene.
        if (this.sphere != null) {
            this.sphere.material.opacity = this.alpha > 0.5 ? this.alpha : 1 - this.alpha;
        }

        renderer.render(this.scene, perspectiveCamera);
    }

    private createSphere(): THREE.Mesh {
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
}
