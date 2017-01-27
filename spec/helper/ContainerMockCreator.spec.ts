/// <reference path="../../typings/index.d.ts" />

import {MockCreator} from "./MockCreator.spec";

import {
    DOMRenderer,
    GLRenderer,
} from "../../src/Render";
import {Container} from "../../src/Viewer";

export class ContainerMockCreator extends MockCreator {
    public createMock(): Container {
        let mock: Container = super.createMock(Container, "Container");

        let domRenderer: DOMRenderer = super.createMock(DOMRenderer, "DOMRenderer");
        Object.defineProperty(
            mock,
            "domRenderer",
            {
                get: (): DOMRenderer => { return domRenderer; },
                set: (value: DOMRenderer): void => { domRenderer = value; },
            });

        let glRenderer: GLRenderer = super.createMock(GLRenderer, "GLRenderer");
        Object.defineProperty(
            mock,
            "glRenderer",
            {
                get: (): GLRenderer => { return glRenderer; },
                set: (value: GLRenderer): void => { glRenderer = value; },
            });

        return mock;
    }
}

export default ContainerMockCreator;
