/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";

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
    private _container: HTMLDivElement;
    private _content: HTMLDivElement;
    private _parentContainer: HTMLElement;
    private _options: IPopupOptions;

    private _point: number[];
    private _rect: number[];

    constructor(options?: IPopupOptions) {
        this._options = {};

        if (!!options) {
            this._options.float = options.float;
            this._options.position = options.position;
        }
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
    }

    public setBasicRect(basicRect: number[]): void {
        this._rect = basicRect.slice();
        this._point = null;
    }

    public setDOMContent(htmlNode: Node): void {
        if (this._content && this._content.parentNode) {
            this._content.parentNode.removeChild(this._content);
        }

        this._content = <HTMLDivElement>this._createElement("div", "PopupContent", this._container);

        this._content.appendChild(htmlNode);
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
            this._container = <HTMLDivElement>this._createElement("div", "Popup", this._parentContainer);
            this._container.appendChild(this._content);
            this._parentContainer.appendChild(this._container);
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

            if (floats.length === 0) {
                float = "bottom";
            } else {
                float = <PopupAlignment>floats.join("-");
            }
        }

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
            const automaticPositions: PopupAlignment[] =
                ["bottom", "top", "left", "right", "bottom-left", "bottom-right", "top-left", "top-right"];

            for (const automaticPosition of automaticPositions) {
                const pointBasic: number[] = this._pointFromRectPosition(rect, automaticPosition);
                const pointPixel: number[] = this._basicToPixel(pointBasic, renderCamera, size, transform);

                if (pointPixel != null &&
                    pointPixel[0] > 0 &&
                    pointPixel[0] < size.width &&
                    pointPixel[1] > 0 &&
                    pointPixel[1] < size.height) {

                    return [pointPixel, automaticPosition];
                }
            }
        }

        const pointBasic: number[] = this._pointFromRectPosition(rect, position);

        return [this._basicToPixel(pointBasic, renderCamera, size, transform), position != null ? position : "bottom"];
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
        const pointPixel: number[] = [Math.round(pointCanvas[0] * size.width), Math.round(pointCanvas[1] * size.height)];

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
