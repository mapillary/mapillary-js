/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {
    GLRenderer,
    IGLRenderHash,
    TextureRenderer,
} from "../../src/Render";

class MockCreator {
    public createMock<T>(ctor: new (...args: any[]) => T, name: string): T {
        let spy: { [key: string]: any } = {};

        for (let key in ctor.prototype) {
            if (!Object.getOwnPropertyDescriptor(ctor.prototype, key).get) {
                spy[key] = jasmine.createSpy(name + "." + key);
            }

        }

        return <T>(spy);
    }
}

class GLRendererMockCreator extends MockCreator {
    public createMock(): GLRenderer {
        let mock: GLRenderer = super.createMock(GLRenderer, "GLRenderer");

        Object.defineProperty(
            mock,
            "webGLRenderer$",
            {
                get: (): Subject<THREE.WebGLRenderer> => { return new Subject<THREE.WebGLRenderer>(); },
            });

        Object.defineProperty(
            mock,
            "render$",
            {
                get: (): Subject<IGLRenderHash> => { return new Subject<IGLRenderHash>(); },
            });

        return mock;
    }
}

describe("GLRenderer.ctor", () => {
    it("should be contructed", () => {
        let glRendererMock: GLRenderer = new GLRendererMockCreator().createMock();

        let textureRenderer: TextureRenderer = new TextureRenderer(glRendererMock);

        expect(textureRenderer).toBeDefined();
    });
});
