/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    RenderTag,
    SpotTag,
    TagOperation,
} from "../../../Component";
import {
    ISpriteAtlas,
    SpriteAlignment,
} from "../../../Viewer";

/**
 * @class OutlineTag
 * @classdesc Tag visualizing a geometry outline.
 */
export class SpotRenderTag extends RenderTag<SpotTag> {
    public dispose(): void { return; }

    public getDOMObjects(
        atlas: ISpriteAtlas,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[] {

        let vNodes: vd.VNode[] = [];

        let centroid3d: number[] = this._tag.geometry.getCentroid3d(this._transform);
        let centroidCameraSpace: THREE.Vector3 = this._convertToCameraSpace(centroid3d, matrixWorldInverse);
        if (centroidCameraSpace.z < 0) {
            let centroidCanvas: number[] = this._projectToCanvas(centroidCameraSpace, projectionMatrix);
            let centroidCss: string[] = centroidCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let interactNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interact$.next({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this._tag });
            };

            if (this._tag.icon != null) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._tag.icon, SpriteAlignment.Center, SpriteAlignment.End);

                    let properties: vd.createProperties = {
                        onmousedown: interactNone,
                        style: {
                            bottom: 100 * (1 - centroidCanvas[1]) + "%",
                            left: centroidCss[0],
                            pointerEvents: "all",
                            position: "absolute",
                            transform: "translate(0px, -8px)",
                        },
                    };

                    vNodes.push(vd.h("div", properties, [sprite]));
                }
            } else if (this._tag.text != null) {
                let properties: vd.createProperties = {
                    onmousedown: interactNone,
                    style: {
                        bottom: 100 * (1 - centroidCanvas[1]) + "%",
                        color: "#" + ("000000" + this._tag.textColor.toString(16)).substr(-6),
                        left: centroidCss[0],
                        pointerEvents: "all",
                        position: "absolute",
                        transform: "translate(-50%, -7px)",
                    },
                    textContent: this._tag.text,
                };

                vNodes.push(vd.h("span.TagSymbol", properties, []));
            }

            let interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid);

            let background: string = "#" + ("000000" + this._tag.color.toString(16)).substr(-6);

            if (this._tag.editable) {
                let interactorProperties: vd.createProperties = {
                    onmousedown: interact,
                    style: {
                        background: background,
                        left: centroidCss[0],
                        pointerEvents: "all",
                        position: "absolute",
                        top: centroidCss[1],
                    },
                };

                vNodes.push(vd.h("div.TagSpotInteractor", interactorProperties, []));
            }

            let pointProperties: vd.createProperties = {
                style: {
                    background: background,
                    left: centroidCss[0],
                    position: "absolute",
                    top: centroidCss[1],
                },
            };

            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
        }

        return vNodes;
    }

    private _interact(operation: TagOperation, vertexIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.next({
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                tag: this._tag,
                vertexIndex: vertexIndex,
            });
        };
    }
}
