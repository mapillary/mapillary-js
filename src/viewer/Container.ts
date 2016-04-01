import {GLRenderer, DOMRenderer, RenderService, RenderMode} from "../Render";
import {StateService} from "../State";
import {MouseService, TouchService} from "../Viewer";

export class Container {
    public id: string;
    public element: HTMLElement;

    public renderService: RenderService;

    public glRenderer: GLRenderer;
    public domRenderer: DOMRenderer;

    public mouseService: MouseService;
    public touchService: TouchService;

    constructor (id: string, stateService: StateService, renderMode: RenderMode) {
        this.id = id;
        this.element = document.getElementById(id);
        this.element.classList.add("mapillary-js");

        this.renderService = new RenderService(this.element, renderMode);

        this.glRenderer = new GLRenderer(this.element, this.renderService, stateService.currentState$);
        this.domRenderer = new DOMRenderer(this.element, this.renderService, stateService.currentState$);

        this.mouseService = new MouseService(this.element);
        this.touchService = new TouchService(this.element);
    }
}

export default Container;
