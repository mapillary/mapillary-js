import {Observable, Subject} from "rxjs";

import {
    IPopupOffset,
    IPopupOptions,
    PopupAlignment,
} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import {
    ISize,
    RenderCamera,
} from "../../../Render";
import {DOM} from "../../../Utils";
import {Alignment} from "../../../Viewer";

/**
 * @class Popup
 *
 * @classdesc Popup instance for rendering custom HTML content
 * on top of images. Popups are based on 2D basic image coordinates
 * (see the {@link Viewer} class documentation for more information about coordinate
 * systems) and a certain popup is therefore only relevant to a single image.
 * Popups related to a certain image should be removed when moving
 * to another image.
 *
 * A popup must have both its content and its point or rect set to be
 * rendered. Popup options can not be updated after creation but the
 * basic point or rect as well as its content can be changed by calling
 * the appropriate methods.
 *
 * To create and add one `Popup` with default configuration
 * (tooltip visuals and automatic float) and one with specific options
 * use
 *
 * @example
 * ```
 * var defaultSpan = document.createElement('span');
 * defaultSpan.innerHTML = 'hello default';
 *
 * var defaultPopup = new Mapillary.PopupComponent.Popup();
 * defaultPopup.setDOMContent(defaultSpan);
 * defaultPopup.setBasicPoint([0.3, 0.3]);
 *
 * var cleanSpan = document.createElement('span');
 * cleanSpan.innerHTML = 'hello clean';
 *
 * var cleanPopup = new Mapillary.PopupComponent.Popup({
 *     clean: true,
 *     float: Mapillary.Alignment.Top,
 *     offset: 10,
 *     opacity: 0.7,
 * });
 *
 * cleanPopup.setDOMContent(cleanSpan);
 * cleanPopup.setBasicPoint([0.6, 0.6]);
 *
 * popupComponent.add([defaultPopup, cleanPopup]);
 * ```
 *
 * @description Implementation of API methods and API documentation inspired
 * by/used from https://github.com/mapbox/mapbox-gl-js/blob/v0.38.0/src/ui/popup.js
 */
export class Popup {
    protected _notifyChanged$: Subject<Popup>;

    private _container: HTMLDivElement;
    private _content: HTMLDivElement;
    private _parentContainer: HTMLElement;
    private _options: IPopupOptions;
    private _tip: HTMLDivElement;

    private _point: number[];
    private _rect: number[];

    private _dom: DOM;
    private _viewportCoords: ViewportCoords;

    constructor(options?: IPopupOptions, viewportCoords?: ViewportCoords, dom?: DOM) {
        this._options = {};

        options = !!options ? options : {};

        this._options.capturePointer = options.capturePointer === false ?
            options.capturePointer : true;

        this._options.clean = options.clean;
        this._options.float = options.float;
        this._options.offset = options.offset;
        this._options.opacity = options.opacity;
        this._options.position = options.position;

        this._dom = !!dom ? dom : new DOM();
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();

        this._notifyChanged$ = new Subject<Popup>();
    }

    /**
     * @description Internal observable used by the component to
     * render the popup when its position or content has changed.
     * @ignore
     */
    public get changed$(): Observable<Popup> {
        return this._notifyChanged$;
    }

    /**
     * @description Internal method used by the component to
     * remove all references to the popup.
     * @ignore
     */
    public remove(): void {
        if (this._content && this._content.parentNode) {
            this._content.parentNode.removeChild(this._content);
        }

        if (this._container) {
            this._container.parentNode.removeChild(this._container);
            delete this._container;
        }

        if (this._parentContainer) {
            delete this._parentContainer;
        }
    }

    /**
     * Sets a 2D basic image coordinates point to the popup's anchor, and
     * moves the popup to it.
     *
     * @description Overwrites any previously set point or rect.
     *
     * @param {Array<number>} basicPoint - Point in 2D basic image coordinates.
     *
     * @example
     * ```
     * var popup = new Mapillary.PopupComponent.Popup();
     * popup.setText('hello image');
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    public setBasicPoint(basicPoint: number[]): void {
        this._point = basicPoint.slice();
        this._rect = null;

        this._notifyChanged$.next(this);
    }

    /**
     * Sets a 2D basic image coordinates rect to the popup's anchor, and
     * moves the popup to it.
     *
     * @description Overwrites any previously set point or rect.
     *
     * @param {Array<number>} basicRect - Rect in 2D basic image
     * coordinates ([topLeftX, topLeftY, bottomRightX, bottomRightY]) .
     *
     * @example
     * ```
     * var popup = new Mapillary.PopupComponent.Popup();
     * popup.setText('hello image');
     * popup.setBasicRect([0.3, 0.3, 0.5, 0.6]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    public setBasicRect(basicRect: number[]): void {
        this._rect = basicRect.slice();
        this._point = null;

        this._notifyChanged$.next(this);
    }

    /**
     * Sets the popup's content to the element provided as a DOM node.
     *
     * @param {Node} htmlNode - A DOM node to be used as content for the popup.
     *
     * @example
     * ```
     * var div = document.createElement('div');
     * div.innerHTML = 'hello image';
     *
     * var popup = new Mapillary.PopupComponent.Popup();
     * popup.setDOMContent(div);
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    public setDOMContent(htmlNode: Node): void {
        if (this._content && this._content.parentNode) {
            this._content.parentNode.removeChild(this._content);
        }

        const className: string = "mapillaryjs-popup-content" +
            (this._options.clean === true ? "-clean" : "") +
            (this._options.capturePointer === true ? " mapillaryjs-popup-capture-pointer" : "");

        this._content = this._dom.createElement("div", className, this._container);

        this._content.appendChild(htmlNode);

        this._notifyChanged$.next(this);
    }

    /**
     * Sets the popup's content to the HTML provided as a string.
     *
     * @description This method does not perform HTML filtering or sanitization,
     * and must be used only with trusted content. Consider Popup#setText if the
     * content is an untrusted text string.
     *
     * @param {string} html - A string representing HTML content for the popup.
     *
     * @example
     * ```
     * var popup = new Mapillary.PopupComponent.Popup();
     * popup.setHTML('<div>hello image</div>');
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    public setHTML(html: string): void {
        const frag: DocumentFragment = this._dom.document.createDocumentFragment();
        const temp: HTMLBodyElement = this._dom.createElement("body");
        let child: Node;
        temp.innerHTML = html;

        while (true) {
            child = temp.firstChild;
            if (!child) {
                break;
            }

            frag.appendChild(child);
        }

        this.setDOMContent(frag);
    }

    /**
     * Sets the popup's content to a string of text.
     *
     * @description This function creates a Text node in the DOM, so it cannot insert raw HTML.
     * Use this method for security against XSS if the popup content is user-provided.
     *
     * @param {string} text - Textual content for the popup.
     *
     * @example
     * ```
     * var popup = new Mapillary.PopupComponent.Popup();
     * popup.setText('hello image');
     * popup.setBasicPoint([0.3, 0.3]);
     *
     * popupComponent.add([popup]);
     * ```
     */
    public setText(text: string): void {
        this.setDOMContent(this._dom.document.createTextNode(text));
    }

    /**
     * @description Internal method for attaching the popup to
     * its parent container so that it is rendered in the DOM tree.
     * @ignore
     */
    public setParentContainer(parentContainer: HTMLElement): void {
        this._parentContainer = parentContainer;
    }

    /**
     * @description Internal method for updating the rendered
     * position of the popup called by the popup component.
     * @ignore
     */
    public update(renderCamera: RenderCamera, size: ISize, transform: Transform): void {
        if (!this._parentContainer || !this._content) {
            return;
        }

        if (!this._point && !this._rect) {
            return;
        }

        if (!this._container) {
            this._container = this._dom.createElement("div", "mapillaryjs-popup", this._parentContainer);

            const showTip: boolean =
                this._options.clean !== true &&
                this._options.float !== Alignment.Center;

            if (showTip) {
                const tipClassName: string =
                    "mapillaryjs-popup-tip" +
                    (this._options.capturePointer === true ? " mapillaryjs-popup-capture-pointer" : "");

                this._tip = this._dom.createElement("div", tipClassName, this._container);
                this._dom.createElement("div", "mapillaryjs-popup-tip-inner", this._tip);
            }

            this._container.appendChild(this._content);
            this._parentContainer.appendChild(this._container);

            if (this._options.opacity != null) {
                this._container.style.opacity = this._options.opacity.toString();
            }
        }

        let pointPixel: number[] = null;
        let position: PopupAlignment = this._alignmentToPopupAligment(this._options.position);
        let float: PopupAlignment = this._alignmentToPopupAligment(this._options.float);

        const classList: DOMTokenList = this._container.classList;

        if (this._point != null) {
            pointPixel =
                this._viewportCoords.basicToCanvasSafe(
                    this._point[0],
                    this._point[1],
                    { offsetHeight: size.height, offsetWidth: size.width },
                    transform,
                    renderCamera.perspective);
        } else {
            const alignments: PopupAlignment[] =
                ["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"];

            let appliedPosition: PopupAlignment = null;
            for (const alignment of alignments) {
                if (classList.contains(`mapillaryjs-popup-float-${alignment}`)) {
                    appliedPosition = alignment;
                    break;
                }
            }

            [pointPixel, position] = this._rectToPixel(this._rect, position, appliedPosition, renderCamera, size, transform);

            if (!float) {
                float = position;
            }
        }

        if (pointPixel == null) {
            this._container.style.display = "none";
            return;
        }

        this._container.style.display = "";

        if (!float) {
            const width: number = this._container.offsetWidth;
            const height: number = this._container.offsetHeight;
            const floats: PopupAlignment[] = this._pixelToFloats(pointPixel, size, width, height);

            float = floats.length === 0 ? "top" : <PopupAlignment>floats.join("-");
        }

        const offset: { [key in PopupAlignment]: number[] } = this._normalizeOffset(this._options.offset);

        pointPixel = [pointPixel[0] + offset[float][0], pointPixel[1] + offset[float][1]];
        pointPixel = [Math.round(pointPixel[0]), Math.round(pointPixel[1])];

        const floatTranslate: {[key in PopupAlignment]: string } = {
            "bottom": "translate(-50%,0)",
            "bottom-left": "translate(-100%,0)",
            "bottom-right": "translate(0,0)",
            "center": "translate(-50%,-50%)",
            "left": "translate(-100%,-50%)",
            "right": "translate(0,-50%)",
            "top": "translate(-50%,-100%)",
            "top-left": "translate(-100%,-100%)",
            "top-right": "translate(0,-100%)",
        };

        for (const key in floatTranslate) {
            if (!floatTranslate.hasOwnProperty(key)) {
                continue;
            }

            classList.remove(`mapillaryjs-popup-float-${key}`);
        }

        classList.add(`mapillaryjs-popup-float-${float}`);

        this._container.style.transform = `${floatTranslate[float]} translate(${pointPixel[0]}px,${pointPixel[1]}px)`;
    }

    private _rectToPixel(
        rect: number[],
        position: PopupAlignment,
        appliedPosition: PopupAlignment,
        renderCamera: RenderCamera,
        size: ISize,
        transform: Transform): [number[], PopupAlignment] {

        if (!position) {
            const width: number = this._container.offsetWidth;
            const height: number = this._container.offsetHeight;

            const floatOffsets: { [key: string]: number[] } = {
                "bottom": [0, height / 2],
                "bottom-left": [-width / 2, height / 2],
                "bottom-right": [width / 2, height / 2],
                "left": [-width / 2, 0],
                "right": [width / 2, 0],
                "top": [0, -height / 2],
                "top-left": [-width / 2, -height / 2],
                "top-right": [width / 2, -height / 2],
            };

            const automaticPositions: PopupAlignment[] =
                ["top", "bottom", "left", "right"];

            let largestVisibleArea: [number, number[], PopupAlignment] = [0, null, null];

            for (const automaticPosition of automaticPositions) {
                const autoPointBasic: number[] = this._pointFromRectPosition(rect, automaticPosition);
                const autoPointPixel: number[] =
                    this._viewportCoords.basicToCanvasSafe(
                        autoPointBasic[0],
                        autoPointBasic[1],
                        { offsetHeight: size.height, offsetWidth: size.width },
                        transform,
                        renderCamera.perspective);

                if (autoPointPixel == null) {
                    continue;
                }

                const floatOffset: number[] = floatOffsets[automaticPosition];
                const offsetedPosition: number[] = [autoPointPixel[0] + floatOffset[0], autoPointPixel[1] + floatOffset[1]];
                const staticCoeff: number = appliedPosition != null && appliedPosition === automaticPosition ? 1 : 0.7;
                const floats: PopupAlignment[] =
                    this._pixelToFloats(offsetedPosition, size, width / staticCoeff, height / (2 * staticCoeff));

                if (floats.length === 0 &&
                    autoPointPixel[0] > 0 &&
                    autoPointPixel[0] < size.width &&
                    autoPointPixel[1] > 0 &&
                    autoPointPixel[1] < size.height) {

                    return [autoPointPixel, automaticPosition];
                }

                const minX: number = Math.max(offsetedPosition[0] - width / 2, 0);
                const maxX: number = Math.min(offsetedPosition[0] + width / 2, size.width);
                const minY: number = Math.max(offsetedPosition[1] - height / 2, 0);
                const maxY: number = Math.min(offsetedPosition[1] + height / 2, size.height);

                const visibleX: number = Math.max(0, maxX - minX);
                const visibleY: number = Math.max(0, maxY - minY);

                const visibleArea: number = staticCoeff * visibleX * visibleY;

                if (visibleArea > largestVisibleArea[0]) {
                    largestVisibleArea[0] = visibleArea;
                    largestVisibleArea[1] = autoPointPixel;
                    largestVisibleArea[2] = automaticPosition;
                }
            }

            if (largestVisibleArea[0] > 0) {
                return [largestVisibleArea[1], largestVisibleArea[2]];
            }
        }

        const pointBasic: number[] = this._pointFromRectPosition(rect, position);
        const pointPixel: number[] =
            this._viewportCoords.basicToCanvasSafe(
                pointBasic[0],
                pointBasic[1],
                { offsetHeight: size.height, offsetWidth: size.width },
                transform,
                renderCamera.perspective);

        return [pointPixel, position != null ? position : "top"];
    }

    private _alignmentToPopupAligment(float: Alignment): PopupAlignment {
        switch (float) {
            case Alignment.Bottom:
                return "bottom";
            case Alignment.BottomLeft:
                return "bottom-left";
            case Alignment.BottomRight:
                return "bottom-right";
            case Alignment.Center:
                return "center";
            case Alignment.Left:
                return "left";
            case Alignment.Right:
                return "right";
            case Alignment.Top:
                return "top";
            case Alignment.TopLeft:
                return "top-left";
            case Alignment.TopRight:
                return "top-right";
            default:
                return null;
        }
    }

    private _normalizeOffset(offset: number | IPopupOffset): { [key in PopupAlignment]: number[] } {
        if (offset == null) {
            return this._normalizeOffset(0);
        }

        if (typeof offset === "number") {
            // input specifies a radius
            const sideOffset: number = <number>offset;
            const sign: number = sideOffset >= 0 ? 1 : -1;
            const cornerOffset: number = sign * Math.round(Math.sqrt(0.5 * Math.pow(sideOffset, 2)));
            return {
                "bottom": [0, sideOffset],
                "bottom-left": [-cornerOffset, cornerOffset],
                "bottom-right": [cornerOffset, cornerOffset],
                "center": [0, 0],
                "left": [-sideOffset, 0],
                "right": [sideOffset, 0],
                "top": [0, -sideOffset],
                "top-left": [-cornerOffset, -cornerOffset],
                "top-right": [cornerOffset, -cornerOffset],
            };
        } else {
            // input specifes a value for each position
            return {
                "bottom": offset.bottom || [0, 0],
                "bottom-left": offset.bottomLeft || [0, 0],
                "bottom-right": offset.bottomRight || [0, 0],
                "center": offset.center || [0, 0],
                "left": offset.left || [0, 0],
                "right": offset.right || [0, 0],
                "top": offset.top || [0, 0],
                "top-left": offset.topLeft || [0, 0],
                "top-right": offset.topRight || [0, 0],
               };
        }
    }

    private _pixelToFloats(pointPixel: number[], size: ISize, width: number, height: number): PopupAlignment[] {
        const floats: PopupAlignment[] = [];

        if (pointPixel[1] < height) {
            floats.push("bottom");
        } else if (pointPixel[1] > size.height - height) {
            floats.push("top");
        }

        if (pointPixel[0] < width / 2) {
            floats.push("right");
        } else if (pointPixel[0] > size.width - width / 2) {
            floats.push("left");
        }

        return floats;
    }

    private _pointFromRectPosition(rect: number[], position: PopupAlignment): number[] {
        const x0: number = rect[0];
        const x1: number = rect[0] < rect[2] ? rect[2] : rect[2] + 1;
        const y0: number = rect[1];
        const y1: number = rect[3];

        switch (position) {
            case "bottom":
                return [(x0 + x1) / 2, y1];
            case "bottom-left":
                return [x0, y1];
            case "bottom-right":
                return [x1, y1];
            case "center":
                return [(x0 + x1) / 2, (y0 + y1) / 2];
            case "left":
                return [x0, (y0 + y1) / 2];
            case "right":
                return [x1, (y0 + y1) / 2];
            case "top":
                return [(x0 + x1) / 2, y0];
            case "top-left":
                return [x0, y0];
            case "top-right":
                return [x1, y0];
            default:
                return [(x0 + x1) / 2, y1];
        }
    }
}

export default Popup;
