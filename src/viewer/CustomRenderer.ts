import { combineLatest as observableCombineLatest } from "rxjs";
import {
    take,
    withLatestFrom,
} from "rxjs/operators";

import { ICustomRenderer } from "./interfaces/ICustomRenderer";
import { Navigator } from "./Navigator";
import { Container } from "./Container";
import { SubscriptionHolder } from "../utils/SubscriptionHolder";
import { ILatLonAlt } from "../geo/interfaces/ILatLonAlt";
import { WebGLRenderer } from "three";
import { RenderCamera } from "../render/RenderCamera";
import { Viewer } from "./Viewer";

export class CustomRenderer {
    private _renderers: {
        [id: string]: {
            renderer: ICustomRenderer,
            subs: SubscriptionHolder,
        }
    };

    constructor(
        private _container: Container,
        private _navigator: Navigator) {
        this._renderers = {};
    }

    public addCustomRenderer(renderer: ICustomRenderer, viewer: Viewer): void {
        const subs = new SubscriptionHolder();
        this._renderers[renderer.id] = { subs, renderer };

        subs.push(observableCombineLatest(
            [
                this._container.glRenderer.webGLRenderer$,
                this._navigator.stateService.reference$,
            ])
            .pipe(take(1))
            .subscribe(
                ([gl, reference]:
                    [WebGLRenderer, ILatLonAlt]): void => {
                    renderer.onAdd(viewer, reference, gl.getContext());
                }));

        subs.push(this._container.glRenderer.postrender$
            .pipe(
                withLatestFrom(
                    this._container.renderService.renderCamera$,
                    this._container.glRenderer.webGLRenderer$))
            .subscribe(
                ([, renderCamera, glRenderer]:
                    [void, RenderCamera, WebGLRenderer]): void => {
                    const context = glRenderer.getContext();
                    const viewMatrix =
                        renderCamera.perspective.matrixWorldInverse;
                    const projectionMatrix =
                        renderCamera.perspective.projectionMatrix;

                    renderer.render(
                        context,
                        viewMatrix.toArray(),
                        projectionMatrix.toArray());
                }));

        subs.push(this._navigator.stateService.reference$
            .subscribe(
                (reference: ILatLonAlt): void => {
                    renderer.onReferenceChanged(viewer, reference);
                }));
    }

    public dispose(viewer: Viewer): void {
        for (const id of Object.keys(this._renderers)) {
            this.removeCustomRenderer(id, viewer);
        }
    }

    public hasCustomRenderer(id: string): boolean {
        return id in this._renderers;
    }

    public removeCustomRenderer(id: string, viewer: Viewer): void {
        this._renderers[id].subs.unsubscribe();

        const renderer = this._renderers[id].renderer;
        delete this._renderers[id];

        this._container.glRenderer.webGLRenderer$
            .subscribe(
                (gl: WebGLRenderer): void => {
                    renderer.onRemove(viewer, gl.getContext());
                });
    }
}
