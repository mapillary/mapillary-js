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

        this._mockProperty(mock, "webGLRenderer$", new Subject<THREE.WebGLRenderer>());
        this._mockProperty(mock, "render$", new Subject<IGLRenderHash>());

        return mock;
    }
}

export default GLRendererMockCreator;
