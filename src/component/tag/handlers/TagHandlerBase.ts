import { Transform } from "../../../geo/Transform";
import { ViewportCoords } from "../../../geo/ViewportCoords";
import { RenderCamera } from "../../../render/RenderCamera";
import { Container } from "../../../viewer/Container";
import { Navigator } from "../../../viewer/Navigator";
import { Component } from "../../Component";
import { TagConfiguration } from "../../interfaces/TagConfiguration";
import { HandlerBase } from "../../util/HandlerBase";

export abstract class TagHandlerBase extends HandlerBase<TagConfiguration> {
    protected _name: string;

    protected _viewportCoords: ViewportCoords;

    constructor(
        component: Component<TagConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator);

        this._name = `${this._component.name}-${this._getNameExtension()}`;

        this._viewportCoords = viewportCoords;
    }

    protected _getConfiguration(enable: boolean): TagConfiguration {
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
