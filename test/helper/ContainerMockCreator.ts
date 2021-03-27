import { Container } from "../../src/viewer/Container";
import { DOMRendererMockCreator } from "./DOMRendererMockCreator";
import { GLRendererMockCreator } from "./GLRendererMockCreator";
import { KeyboardServiceMockCreator } from "./KeyboardServiceMockCreator";
import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";
import { MouseServiceMockCreator } from "./MouseServiceMockCreator";
import { RenderServiceMockCreator } from "./RenderServiceMockCreator";
import { SpriteServiceMockCreator } from "./SpriteServiceMockCreator";
import { TouchServiceMockCreator } from "./TouchServiceMockCreator";

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
