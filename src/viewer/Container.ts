import { KeyboardService } from "./KeyboardService";
import { MouseService } from "./MouseService";
import { SpriteService } from "./SpriteService";
import { TouchService } from "./TouchService";
import { IViewerOptions } from "./interfaces/IViewerOptions";

import { DOMRenderer } from "../render/DOMRenderer";
import { GLRenderer } from "../render/GLRenderer";
import { RenderService } from "../render/RenderService";
import { StateService } from "../state/StateService";
import { DOM } from "../utils/DOM";

export class Container {
    public id: string;

    public renderService: RenderService;

    public glRenderer: GLRenderer;
    public domRenderer: DOMRenderer;

    public keyboardService: KeyboardService;
    public mouseService: MouseService;
    public touchService: TouchService;

    public spriteService: SpriteService;

    private _canvasContainer: HTMLDivElement;
    private _canvas: HTMLCanvasElement;
    private _container: HTMLElement;
    private _domContainer: HTMLDivElement;

    private _dom: DOM;

    constructor(
        options: IViewerOptions,
        stateService: StateService,
        dom?: DOM) {

        this._dom = !!dom ? dom : new DOM();

        if (typeof options.container === 'string') {
            this._container =
                this._dom.document.getElementById(options.container);
            if (!this._container) {
                throw new Error(`Container '${options.container}' not found.`);
            }
        } else if (options.container instanceof HTMLElement) {
            this._container = options.container;
        } else {
            throw new Error(`Invalid type: 'container' must be a String or HTMLElement.`);
        }

        this.id = !!this._container.id ? this._container.id : "mapillary-js-fallback-container-id";

        this._container.classList.add("mapillary-js");
        this._domContainer = this._dom.createElement("div", "mapillary-js-dom", this._container);

        this._canvasContainer = this._dom.createElement("div", "mapillary-js-interactive", this._container);

        this._canvas = this._dom.createElement("canvas", "mapillary-js-canvas");
        this._canvas.style.position = "absolute";
        this._canvas.setAttribute("tabindex", "0");

        this.renderService = new RenderService(
            this._container,
            stateService.currentState$,
            options.renderMode);

        this.glRenderer = new GLRenderer(
            this._canvas,
            this._canvasContainer,
            this.renderService);

        this.domRenderer = new DOMRenderer(
            this._domContainer,
            this.renderService,
            stateService.currentState$);

        this.keyboardService = new KeyboardService(this._canvasContainer);
        this.mouseService = new MouseService(
            this._container,
            this._canvasContainer,
            this._domContainer,
            document);

        this.touchService = new TouchService(
            this._canvasContainer,
            this._domContainer);

        this.spriteService = new SpriteService(options.sprite);
    }

    public get canvas(): HTMLCanvasElement {
        return !!this._canvas.parentNode ?
            this._canvas : null;
    }

    public get canvasContainer(): HTMLDivElement {
        return this._canvasContainer;
    }

    public get container(): HTMLElement {
        return this._container;
    }

    public get domContainer(): HTMLDivElement {
        return this._domContainer;
    }

    public remove(): void {
        this.spriteService.dispose();
        this.touchService.dispose();
        this.mouseService.dispose();

        this.glRenderer.remove();
        this.domRenderer.remove();

        this.renderService.dispose();

        this._removeNode(this._canvasContainer);
        this._removeNode(this._domContainer);

        this._container.classList.remove('mapillary-js');
    }

    private _removeNode(node: Node): void {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
}
