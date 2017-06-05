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
    private _positionBasic: number[];

    constructor(options?: IPopupOptions) {
        this._options = {};

        if (!!options) {
            this._options.anchor = options.anchor;
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

    public setBasicPosition(basic: number[]): void {
        this._positionBasic = basic;
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
        if (!this._parentContainer || !this._content || !this._positionBasic) {
            return;
        }

        if (!this._container) {
            this._container = <HTMLDivElement>this._createElement("div", "Popup", this._parentContainer);
            this._container.appendChild(this._content);
            this._parentContainer.appendChild(this._container);
        }

        const position3d: number[] = transform.unprojectBasic(this._positionBasic, 200);
        const matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(renderCamera.perspective.matrixWorld);
        const positionCameraSpace: THREE.Vector3 = this._convertToCameraSpace(position3d, matrixWorldInverse);
        const positionCanvas: number[] = this._projectToCanvas(positionCameraSpace, renderCamera.perspective.projectionMatrix);
        const positionPixel: number[] = [Math.round(positionCanvas[0] * size.width), Math.round(positionCanvas[1] * size.height)];

        let anchor: PopupAlignment = this._options.anchor;

        if (!anchor) {
            const width: number = this._container.offsetWidth;
            const height: number = this._container.offsetHeight;
            const anchors: PopupAlignment[] = [];

            if (positionPixel[1] < height) {
                anchors.push("top");
            } else if (positionPixel[1] > size.height - height) {
                anchors.push("bottom");
            }

            if (positionPixel[0] < width / 2) {
                anchors.push("left");
            } else if (positionPixel[0] > size.width - width / 2) {
                anchors.push("right");
            }

            if (anchors.length === 0) {
                anchor = "top";
            } else {
                anchor = <PopupAlignment>anchors.join("-");
            }
        }

        const anchorTranslate: {[key in PopupAlignment]: string } = {
            "bottom": "translate(-50%,-100%)",
            "bottom-left": "translate(0,-100%)",
            "bottom-right": "translate(-100%,-100%)",
            "center": "translate(-50%,-50%)",
            "left": "translate(0,-50%)",
            "right": "translate(-100%,-50%)",
            "top": "translate(-50%,0)",
            "top-left": "translate(0,0)",
            "top-right": "translate(-100%,0)",
        };

        this._container.style.transform = `${anchorTranslate[anchor]} translate(${positionPixel[0]}px,${positionPixel[1]}px)`;
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
