import {
    GLRenderer,
    DOMRenderer,
    RenderService,
} from "../Render";
import { StateService } from "../State";
import { DOM } from "../Utils";
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
    private _container: HTMLElement;
    private _domContainer: HTMLElement;

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

        this._canvasContainer = this._dom.createElement("div", "mapillary-js-interactive", this._container);
        this._domContainer = this._dom.createElement("div", "mapillary-js-dom", this._container);

        this.renderService = new RenderService(this._container, stateService.currentState$, options.renderMode);

        this.glRenderer = new GLRenderer(this._canvasContainer, this.renderService, this._dom);
        this.domRenderer = new DOMRenderer(this._domContainer, this.renderService, stateService.currentState$);

        this.keyboardService = new KeyboardService(this._canvasContainer);
        this.mouseService = new MouseService(this._container, this._canvasContainer, this._domContainer, document);
        this.touchService = new TouchService(this._canvasContainer, this._domContainer);

        this.spriteService = new SpriteService(options.sprite);
    }

    public get container(): HTMLElement {
        return this._container;
    }

    public get canvasContainer(): HTMLElement {
        return this._canvasContainer;
    }

    public get domContainer(): HTMLElement {
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

export default Container;
