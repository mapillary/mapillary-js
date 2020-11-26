import { DOMRendererMockCreator } from "./DOMRendererMockCreator.spec";
import { GLRendererMockCreator } from "./GLRendererMockCreator.spec";
import { KeyboardServiceMockCreator } from "./KeyboardServiceMockCreator.spec";
import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";
import { MouseServiceMockCreator } from "./MouseServiceMockCreator.spec";
import { RenderServiceMockCreator } from "./RenderServiceMockCreator.spec";
import { SpriteServiceMockCreator } from "./SpriteServiceMockCreator.spec";
import { TouchServiceMockCreator } from "./TouchServiceMockCreator.spec";

import { Container } from "../../src/Viewer";

export class ContainerMockCreator extends MockCreatorBase<Container> {
    public create(): Container {
        const mock: Container = new MockCreator().create(Container, "Container");

        this._mockProperty(mock, "canvasContainer", document.createElement("canvas"));
        this._mockProperty(mock, "domRenderer", new DOMRendererMockCreator().create());
        this._mockProperty(mock, "container", document.createElement("div"));
        this._mockProperty(mock, "glRenderer", new GLRendererMockCreator().create());
        this._mockProperty(mock, "keyboardService", new KeyboardServiceMockCreator().create());
        this._mockProperty(mock, "mouseService", new MouseServiceMockCreator().create());
        this._mockProperty(mock, "renderService", new RenderServiceMockCreator().create());
        this._mockProperty(mock, "spriteService", new SpriteServiceMockCreator().create());
        this._mockProperty(mock, "touchService", new TouchServiceMockCreator().create());

        return mock;
    }
}

export default ContainerMockCreator;
