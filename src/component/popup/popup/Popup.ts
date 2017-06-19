/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    IPopupOptions,
    PopupAlignment,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {
    ISize,
    RenderCamera,
} from "../../../Render";

export class Popup {
    protected _notifyChanged$: Subject<Popup>;

    private _container: HTMLDivElement;
    private _content: HTMLDivElement;
    private _parentContainer: HTMLElement;
    private _options: IPopupOptions;
    private _tip: HTMLDivElement;

    private _point: number[];
    private _rect: number[];

    constructor(options?: IPopupOptions) {
        this._options = {};

        if (!!options) {
            this._options.clean = options.clean;
            this._options.float = options.float;
            this._options.offset = options.offset;
            this._options.opacity = options.opacity;
            this._options.position = options.position;
        }

        this._notifyChanged$ = new Subject<Popup>();
    }

    public get changed$(): Observable<Popup> {
        return this._notifyChanged$;
    }

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

    public setBasicPoint(basicPoint: number[]): void {
        this._point = basicPoint.slice();
        this._rect = null;

        this._notifyChanged$.next(this);
    }

    public setBasicRect(basicRect: number[]): void {
        this._rect = basicRect.slice();
        this._point = null;

        this._notifyChanged$.next(this);
    }

    public setDOMContent(htmlNode: Node): void {
        if (this._content && this._content.parentNode) {
            this._content.parentNode.removeChild(this._content);
        }

        const className: string = "mapillaryjs-popup-content" + (this._options.clean === true ? "-clean" : "");
        this._content = <HTMLDivElement>this._createElement("div", className, this._container);

        this._content.appendChild(htmlNode);

        this._notifyChanged$.next(this);
    }

    public setHTML(html: string): void {
        const frag: DocumentFragment = document.createDocumentFragment();
        const temp: HTMLBodyElement = document.createElement("body");
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

    public setText(text: string): void {
        this.setDOMContent(document.createTextNode(text));
    }

    public setParentContainer(parentContainer: HTMLElement): void {
        this._parentContainer = parentContainer;
    }

    public update(renderCamera: RenderCamera, size: ISize, transform: Transform): void {
        if (!this._parentContainer || !this._content) {
            return;
        }

        if (!this._point && !this._rect) {
            return;
        }

        if (!this._container) {
            this._container = <HTMLDivElement>this._createElement("div", "mapillaryjs-popup", this._parentContainer);
            if (this._options.clean !== true) {
                this._tip = <HTMLDivElement>this._createElement("div", "mapillaryjs-popup-tip", this._container);
                this._createElement("div", "mapillaryjs-popup-tip-inner", this._tip);
            }

            this._container.appendChild(this._content);
            this._parentContainer.appendChild(this._container);

            if (this._options.opacity != null) {
                this._container.style.opacity = this._options.opacity.toString();
            }
        }

        let pointPixel: number[] = null;
        let position: PopupAlignment = this._options.position;
        let float: PopupAlignment = this._options.float;

        if (this._point != null) {
            pointPixel = this._basicToPixel(this._point, renderCamera, size, transform);
        } else {
            [pointPixel, position] = this._rectToPixel(this._rect, position, renderCamera, size, transform);

            if (!float) {
                float = position;
            }
        }

        if (pointPixel == null) {
            this._container.style.visibility = "hidden";
            return;
        }

        this._container.style.visibility = "visible";

        if (!float) {
            const width: number = this._container.offsetWidth;
            const height: number = this._container.offsetHeight;
            const floats: PopupAlignment[] = this._pixelToFloats(pointPixel, size, width, height);

            float = floats.length === 0 ? "bottom" : <PopupAlignment>floats.join("-");
        }

        if (!!this._options.offset) {
            const offset: number = this._options.offset;
            const sign: number = offset >= 0 ? 1 : -1;
            const cornerOffset: number = sign * Math.round(Math.sqrt(0.5 * Math.pow(offset, 2)));
            const floatOffset: { [key in PopupAlignment]: number[] } = {
                "bottom": [0, offset],
                "bottom-left": [-cornerOffset, cornerOffset],
                "bottom-right": [cornerOffset, cornerOffset],
                "center": [0, 0],
                "left": [-offset, 0],
                "right": [offset, 0],
                "top": [0, -offset],
                "top-left": [-cornerOffset, -cornerOffset],
                "top-right": [cornerOffset, -cornerOffset],
            };

            pointPixel = [pointPixel[0] + floatOffset[float][0], pointPixel[1] + floatOffset[float][1]];
        }

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

        const classList: DOMTokenList = this._container.classList;
        for (const key in floatTranslate) {
            if (!floatTranslate.hasOwnProperty(key)) {
                continue;
            }

            classList.remove(`mapillaryjs-popup-float-${key}`);
        }

        classList.add(`mapillaryjs-popup-float-${float}`);

        this._container.style.transform = `${floatTranslate[float]} translate(${pointPixel[0]}px,${pointPixel[1]}px)`;
    }

    private _createElement(tagName: string, className: string, container: HTMLElement): HTMLElement {
        const element: HTMLElement = document.createElement(tagName);

        if (!!className) {
            element.className = className;
        }

        if (!!container) {
            container.appendChild(element);
        }

        return element;
    }

    private _rectToPixel(
        rect: number[],
        position: PopupAlignment,
        renderCamera: RenderCamera,
        size: ISize, transform:
        Transform): [number[], PopupAlignment] {

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
                ["bottom", "top", "left", "right"];

            let largestVisibleArea: [number, number[], PopupAlignment] = [0, null, null];

            for (const automaticPosition of automaticPositions) {
                const pointBasic: number[] = this._pointFromRectPosition(rect, automaticPosition);
                const pointPixel: number[] = this._basicToPixel(pointBasic, renderCamera, size, transform);

                if (pointPixel == null) {
                    continue;
                }

                const floatOffset: number[] = floatOffsets[automaticPosition];
                const offsetedPosition: number[] = [pointPixel[0] + floatOffset[0], pointPixel[1] + floatOffset[1]];
                const floats: PopupAlignment[] = this._pixelToFloats(offsetedPosition, size, width, height / 2);

                if (floats.length === 0 &&
                    pointPixel[0] > 0 &&
                    pointPixel[0] < size.width &&
                    pointPixel[1] > 0 &&
                    pointPixel[1] < size.height) {

                    return [pointPixel, automaticPosition];
                }

                const minX: number = Math.max(offsetedPosition[0] - width / 2, 0);
                const maxX: number = Math.min(offsetedPosition[0] + width / 2, size.width);
                const minY: number = Math.max(offsetedPosition[1] - height / 2, 0);
                const maxY: number = Math.min(offsetedPosition[1] + height / 2, size.height);

                const visibleX: number = Math.max(0, maxX - minX);
                const visibleY: number = Math.max(0, maxY - minY);
                const visibleArea: number = visibleX * visibleY;

                if (visibleArea > largestVisibleArea[0]) {
                    largestVisibleArea[0] = visibleArea;
                    largestVisibleArea[1] = pointPixel;
                    largestVisibleArea[2] = automaticPosition;
                }
            }

            if (largestVisibleArea[0] > 0) {
                return [largestVisibleArea[1], largestVisibleArea[2]];
            }
        }

        const pointBasic: number[] = this._pointFromRectPosition(rect, position);

        return [this._basicToPixel(pointBasic, renderCamera, size, transform), position != null ? position : "bottom"];
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
        switch (position) {
            case "bottom":
                return [(rect[0] + rect[2]) / 2, rect[3]];
            case "bottom-left":
                return [rect[0], rect[3]];
            case "bottom-right":
                return [rect[2], rect[3]];
            case "center":
                return [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2];
            case "left":
                return [rect[0], (rect[1] + rect[3]) / 2];
            case "right":
                return [rect[2], (rect[1] + rect[3]) / 2];
            case "top":
                return [(rect[0] + rect[2]) / 2, rect[1]];
            case "top-left":
                return [rect[0], rect[1]];
            case "top-right":
                return [rect[2], rect[1]];
            default:
                return [(rect[0] + rect[2]) / 2, rect[3]];
        }
    }

    private _basicToPixel(pointBasic: number[], renderCamera: RenderCamera, size: ISize, transform: Transform): number[] {
        const point3d: number[] = transform.unprojectBasic(pointBasic, 200);
        const matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(renderCamera.perspective.matrixWorld);
        const pointCameraSpace: THREE.Vector3 = this._convertToCameraSpace(point3d, matrixWorldInverse);

        if (pointCameraSpace.z > 0) {
            return null;
        }

        const pointCanvas: number[] = this._projectToCanvas(pointCameraSpace, renderCamera.perspective.projectionMatrix);
        const pointPixel: number[] = [pointCanvas[0] * size.width, pointCanvas[1] * size.height];

        return pointPixel;
    }

    private _projectToCanvas(
        point3d: THREE.Vector3,
        projectionMatrix: THREE.Matrix4):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point3d.x, point3d.y, point3d.z)
                .applyMatrix4(projectionMatrix);

        return [(projected.x + 1) / 2, (-projected.y + 1) / 2];
    }

    private _convertToCameraSpace(
        point3d: number[],
        matrixWorldInverse: THREE.Matrix4):
        THREE.Vector3 {

        return new THREE.Vector3(point3d[0], point3d[1], point3d[2]).applyMatrix4(matrixWorldInverse);
    }
}

export default Popup;
