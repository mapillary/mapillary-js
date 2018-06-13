import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    GLRenderer,
    IGLRenderHash,
} from "../../src/Render";

export class GLRendererMockCreator extends MockCreatorBase<GLRenderer> {
    public create(): GLRenderer {
        const mock: GLRenderer = new MockCreator().create(GLRenderer, "GLRenderer");

        this._mockProperty(mock, "webGLRenderer$", new Subject<THREE.WebGLRenderer>());
        this._mockProperty(mock, "render$", new Subject<IGLRenderHash>());

        return mock;
    }
}

export default GLRendererMockCreator;
