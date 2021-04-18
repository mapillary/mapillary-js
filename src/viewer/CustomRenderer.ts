import { combineLatest as observableCombineLatest } from "rxjs";
import {
    skip,
    take,
    withLatestFrom,
} from "rxjs/operators";

import { ICustomRenderer } from "./interfaces/ICustomRenderer";
import { Navigator } from "./Navigator";
import { Container } from "./Container";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { WebGLRenderer } from "three";
import { RenderCamera } from "../render/RenderCamera";
import { IViewer } from "./interfaces/IViewer";

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

    public add(renderer: ICustomRenderer, viewer: IViewer): void {
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
                    [WebGLRenderer, LngLatAlt]): void => {
                    renderer.onAdd(viewer, reference, gl.getContext());
                }));

        subs.push(this._container.glRenderer.opaqueRender$
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
            .pipe(skip(1))
            .subscribe(
                (reference: LngLatAlt): void => {
                    renderer.onReference(viewer, reference);
                }));
    }

    public dispose(viewer: IViewer): void {
        for (const id of Object.keys(this._renderers)) {
            this.remove(id, viewer);
        }
    }

    public has(id: string): boolean {
        return id in this._renderers;
    }

    public remove(id: string, viewer: IViewer): void {
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
