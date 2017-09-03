import {
    GLRenderer,
    DOMRenderer,
    RenderService,
} from "../Render";
import {StateService} from "../State";
import {
    IViewerOptions,
    KeyboardService,
    MouseService,
    TouchService,
    SpriteService,
} from "../Viewer";

export class Container {
    public id: string;

    public renderService: RenderService;

    public glRenderer: GLRenderer;
    public domRenderer: DOMRenderer;

    public keyboardService: KeyboardService;
    public mouseService: MouseService;
    public touchService: TouchService;

    public spriteService: SpriteService;

    private _canvasContainer: HTMLElement;
    private _canvas: HTMLCanvasElement;
    private _container: HTMLElement;
    private _domContainer: HTMLElement;

    constructor (id: string, stateService: StateService, options: IViewerOptions) {
        this.id = id;

        this._container = document.getElementById(id);

        if (!this._container) {
            throw new Error(`Container '${id}' not found.`);
        }

        this._container.classList.add("mapillary-js");

        this._canvasContainer = document.createElement("div");
        this._canvasContainer.className = "mapillary-js-interactive";

        this._canvas = document.createElement("canvas");
        this._canvas.className = "mapillary-js-canvas";
        this._canvas.style.position = "absolute";
        this._canvas.setAttribute("tabindex", "0");
        this._canvasContainer.appendChild(this._canvas);

        this._domContainer = document.createElement("div");
        this._domContainer.className = "mapillary-js-dom";

        this._container.appendChild(this._canvasContainer);
        this._container.appendChild(this._domContainer);

        this.renderService = new RenderService(this._container, stateService.currentState$, options.renderMode);

        this.glRenderer = new GLRenderer(this._canvas, this.renderService);
        this.domRenderer = new DOMRenderer(this._domContainer, this.renderService, stateService.currentState$);

        this.keyboardService = new KeyboardService(this._canvasContainer);
        this.mouseService = new MouseService(this._container, this._canvasContainer, this._domContainer);
        this.touchService = new TouchService(this._canvasContainer, this._domContainer);

        this.spriteService = new SpriteService(options.sprite);
    }

    public get element(): HTMLElement {
        return this._container;
    }

    public get canvasContainer(): HTMLElement {
        return this._canvasContainer;
    }
}

export default Container;
