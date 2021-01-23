import { Subject } from "rxjs";
import { GLRenderer } from "../../src/render/GLRenderer";
import { IGLRenderHash } from "../../src/render/interfaces/IGLRenderHash";

import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";

export class GLRendererMockCreator extends MockCreatorBase<GLRenderer> {
    public create(): GLRenderer {
        const mock: GLRenderer = new MockCreator().create(GLRenderer, "GLRenderer");

        this._mockProperty(mock, "webGLRenderer$", new Subject<THREE.WebGLRenderer>());
        this._mockProperty(mock, "render$", new Subject<IGLRenderHash>());

        return mock;
    }
}
