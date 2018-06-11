import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    InteractionCursor,
    RenderTag,
    SpotTag,
    Tag,
    TagOperation,
} from "../../../Component";
import {ISize} from "../../../Render";
import {
    Alignment,
    ISpriteAtlas,
} from "../../../Viewer";

/**
 * @class SpotRenderTag
 * @classdesc Tag visualizing the properties of a SpotTag.
 */
export class SpotRenderTag extends RenderTag<SpotTag> {
    public dispose(): void { /* noop */ }

    public getDOMObjects(atlas: ISpriteAtlas, camera: THREE.Camera, size: ISize): vd.VNode[] {
        const tag: SpotTag = this._tag;
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        const vNodes: vd.VNode[] = [];
        const [centroidBasicX, centroidBasicY]: number[] = tag.geometry.getCentroid2d();
        const centroidCanvas: number[] =
            this._viewportCoords.basicToCanvasSafe(
                centroidBasicX,
                centroidBasicY,
                container,
                this._transform,
                camera);

        if (centroidCanvas != null) {
            const interactNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interact$.next({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: tag });
            };

            const canvasX: number = Math.round(centroidCanvas[0]);
            const canvasY: number = Math.round(centroidCanvas[1]);

            if (tag.icon != null) {
                if (atlas.loaded) {
                    const sprite: vd.VNode = atlas.getDOMSprite(tag.icon, Alignment.Bottom);
                    const iconTransform: string = `translate(${canvasX}px,${canvasY + 8}px)`;
                    const properties: vd.createProperties = {
                        onmousedown: interactNone,
                        style: {
                            pointerEvents: "all",
                            transform: iconTransform,
                        },
                    };

                    vNodes.push(vd.h("div", properties, [sprite]));
                }
            } else if (tag.text != null) {
                const textTransform: string = `translate(-50%,0%) translate(${canvasX}px,${canvasY + 8}px)`;
                const properties: vd.createProperties = {
                    onmousedown: interactNone,
                    style: {
                        color: this._colorToCss(tag.textColor),
                        transform: textTransform,
                    },
                    textContent: tag.text,
                };

                vNodes.push(vd.h("span.TagSymbol", properties, []));
            }

            const interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid, tag, "move");
            const background: string = this._colorToCss(tag.color);
            const transform: string = `translate(-50%,-50%) translate(${canvasX}px,${canvasY}px)`;

            if (tag.editable) {
                let interactorProperties: vd.createProperties = {
                    onmousedown: interact,
                    style: {
                        background: background,
                        transform: transform,
                    },
                };

                vNodes.push(vd.h("div.TagSpotInteractor", interactorProperties, []));
            }

            const pointProperties: vd.createProperties = {
                style: {
                    background: background,
                    transform: transform,
                },
            };

            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
        }

        return vNodes;
    }

    public getGLObjects(): THREE.Object3D[] { return []; }

    public getRetrievableObjects(): THREE.Object3D[] { return []; }

    private _colorToCss(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    private _interact(operation: TagOperation, tag: Tag, cursor: InteractionCursor, vertexIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            const offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            const offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.next({
                cursor: cursor,
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                tag: tag,
                vertexIndex: vertexIndex,
            });
        };
    }
}
