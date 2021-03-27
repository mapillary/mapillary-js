import { Subject } from "rxjs";
import { GLRenderer } from "../../src/render/GLRenderer";
import { GLRenderHash } from "../../src/render/interfaces/IGLRenderHash";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

export class GLRendererMockCreator extends MockCreatorBase<GLRenderer> {
    public create(): GLRenderer {
        const mock = new MockCreator().create(GLRenderer, "GLRenderer");

        this._mockProperty(mock, "webGLRenderer$", new Subject<THREE.WebGLRenderer>());
        this._mockProperty(mock, "render$", new Subject<GLRenderHash>());
        this._mockProperty(mock, "opaqueRender$", new Subject<void>());

        return mock;
    }
}
