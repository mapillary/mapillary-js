import {
    Component,
    HandlerBase,
    ITagConfiguration,
} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import {RenderCamera} from "../../../Render";
import {
    Container,
    Navigator,
} from "../../../Viewer";

export abstract class TagHandlerBase extends HandlerBase<ITagConfiguration> {
    protected _name: string;

    protected _viewportCoords: ViewportCoords;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator);

        this._name = `${this._component.name}-${this._getNameExtension()}`;

        this._viewportCoords = viewportCoords;
    }

    protected _getConfiguration(enable: boolean): ITagConfiguration {
        return {};
    }

    protected abstract _getNameExtension(): string;

    protected _mouseEventToBasic(
        event: MouseEvent,
        element: HTMLElement,
        camera: RenderCamera,
        transform: Transform,
        offsetX?: number,
        offsetY?: number):
        number[] {

        offsetX = offsetX != null ? offsetX : 0;
        offsetY = offsetY != null ? offsetY : 0;

        const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);
        const basic: number[] =
            this._viewportCoords.canvasToBasic(
                canvasX - offsetX,
                canvasY - offsetY,
                element,
                transform,
                camera.perspective);

        return basic;
    }
}

export default TagHandlerBase;
