/// <reference path="../../typings/index.d.ts" />

import {GLRendererMockCreator} from "./GLRendererMockCreator.spec";
import {MockCreator} from "./MockCreator.spec";
import {MouseServiceMockCreator} from "./MouseServiceMockCreator.spec";
import {RenderServiceMockCreator} from "./RenderServiceMockCreator.spec";

import {DOMRenderer} from "../../src/Render";
import {Container} from "../../src/Viewer";

export class ContainerMockCreator extends MockCreator {
    public createMock(): Container {
        let mock: Container = super.createMock(Container, "Container");

        this._mockProperty(mock, "domRenderer", super.createMock(DOMRenderer, "DOMRenderer"));
        this._mockProperty(mock, "glRenderer", new GLRendererMockCreator().createMock());
        this._mockProperty(mock, "mouseService", new MouseServiceMockCreator().createMock());
        this._mockProperty(mock, "renderService", new RenderServiceMockCreator().createMock());

        return mock;
    }
}

export default ContainerMockCreator;
