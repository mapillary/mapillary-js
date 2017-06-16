/// <reference path="../../typings/index.d.ts" />

import {DOMRendererMockCreator} from "./DOMRendererMockCreator.spec";
import {GLRendererMockCreator} from "./GLRendererMockCreator.spec";
import {MockCreator} from "./MockCreator.spec";
import {MouseServiceMockCreator} from "./MouseServiceMockCreator.spec";
import {RenderServiceMockCreator} from "./RenderServiceMockCreator.spec";
import {SpriteServiceMockCreator} from "./SpriteServiceMockCreator.spec";
import {TouchServiceMockCreator} from "./TouchServiceMockCreator.spec";

import {Container} from "../../src/Viewer";

export class ContainerMockCreator extends MockCreator {
    public createMock(): Container {
        let mock: Container = super.createMock(Container, "Container");

        this._mockProperty(mock, "domRenderer", new DOMRendererMockCreator().createMock());
        this._mockProperty(mock, "element", document.createElement("div"));
        this._mockProperty(mock, "glRenderer", new GLRendererMockCreator().createMock());
        this._mockProperty(mock, "mouseService", new MouseServiceMockCreator().createMock());
        this._mockProperty(mock, "renderService", new RenderServiceMockCreator().createMock());
        this._mockProperty(mock, "spriteService", new SpriteServiceMockCreator().createMock());
        this._mockProperty(mock, "touchService", new TouchServiceMockCreator().createMock());

        return mock;
    }
}

export default ContainerMockCreator;
