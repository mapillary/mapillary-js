/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    GLRenderer,
    IGLRenderHash,
} from "../../src/Render";

export class GLRendererMockCreator extends MockCreator {
    public createMock(): GLRenderer {
        let mock: GLRenderer = super.createMock(GLRenderer, "GLRenderer");

        let webGLRenderer$: Subject<THREE.WebGLRenderer> = new Subject<THREE.WebGLRenderer>();
        Object.defineProperty(
            mock,
            "webGLRenderer$",
            {
                get: (): Subject<THREE.WebGLRenderer> => { return webGLRenderer$; },
                set: (value: Subject<THREE.WebGLRenderer>): void => { webGLRenderer$ = value; },
            });

        let render$: Subject<IGLRenderHash> = new Subject<IGLRenderHash>();
        Object.defineProperty(
            mock,
            "render$",
            {
                get: (): Subject<IGLRenderHash> => { return render$; },
                set: (value: Subject<IGLRenderHash>): void => { render$ = value; },
            });

        return mock;
    }
}

export default GLRendererMockCreator;
