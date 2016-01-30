/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />


import * as rx from "rx";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {APIv2} from "../API";

import {UIService, UI, IRect} from "../UI";

export class DetectionsUI extends UI {
    public static uiName: string = "detections";
    private _disposable: rx.IDisposable;

    private rectContainer: HTMLElement;
    private detectionData: any;
    private apiV2: APIv2;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this.apiV2 = navigator.apiV2;
    }

    protected _activate(): void {
        let child: HTMLElement = document.createElement("div");
        child.className = "rectContainer";

        this.rectContainer = child;
        this._container.element.appendChild(this.rectContainer);

        this._disposable = this._navigator
            .stateService
            .currentNode$.subscribe((node: Node): void => {
                this.setRectContainer(node.image.width, node.image.height);
                this.removeRectsFromDOM();

                this.apiV2.im.callOr(node.key).then((data: any) => {
                    this.detectionData = data;
                    this.updateRects(this.detectionData.or_rects);
                });
            });
    }

    protected _deactivate(): void {
        this.rectContainer = undefined;
        this.detectionData = undefined;
        this._disposable.dispose();
    }

   /**
    * Update detection rects in the DOM
    */
    private updateRects (rects: Array<IRect>): void {
        rects.forEach((r: IRect) => {
            let rect: HTMLElement = document.createElement("div");

            let adjustedRect: Array<number> = this.coordsToCss(r.rect);

            // map adjusted coordinates to valid CSS styles
            let rectMapped: Array<string> = adjustedRect.map((el: number) => {
                return (el * 100) + "%";
            });

            this.setRectStyling(rect, rectMapped);
            this.rectContainer.appendChild(rect);
        });
    }

    /**
     * Adjust x1, y1, x2, y2 coordinates to CSS styling, so the rectangle
     * can displays correctly with top, ripht, bottom, left styling.
     */
    private coordsToCss (rects: Array<number>): Array<number> {

        // copy the array
        let adjustedCoords: Array<number> = rects.concat();

        // adjust the x2 (right) position
        adjustedCoords[2] = 1 - adjustedCoords[2];

        // adjust the y2 (bottom) position
        adjustedCoords[3] = 1 - adjustedCoords[3];

        return adjustedCoords;

    }

    /**
     * Set the className and position of the rectangle. Expects the `position: absolute`
     * being set through CSS stylesheets.
     */
    private setRectStyling (rect: HTMLElement, mappedRect: Array<string>): void {
        rect.className = "Rect";
        rect.style.top = mappedRect[1];
        rect.style.bottom = mappedRect[3];
        rect.style.right = mappedRect[2];
        rect.style.left = mappedRect[0];
    }

    /**
     * Remove all existing DOM nodes from the container
     */
    private removeRectsFromDOM (): void {
        while (this.rectContainer.firstChild) {
            this.rectContainer.removeChild(this.rectContainer.firstChild);
        }
    }


    /**
     * Sets the rectContainer size to match ratio of currently displayed photo
     */
    private setRectContainer (w: number, h: number): void {
        let cw: number = this._container.element.clientWidth;
        let ch: number = this._container.element.clientHeight;

        let ratioW: number = (ch / h * w);

        let offset: number  = (cw - ratioW) / 2;

        this.rectContainer.style.left = `${offset}px`;
        this.rectContainer.style.right = `${offset}px`;
    }

}

UIService.register(DetectionsUI);
export default DetectionsUI;
