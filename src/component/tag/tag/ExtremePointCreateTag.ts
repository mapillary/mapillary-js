import * as vd from "virtual-dom";
import * as THREE from "three";

import { ViewportCoords, Transform } from "../../../Geo";
import { ISize } from "../../../Render";
import { RectGeometry, PointsGeometry } from "../TagExport";
import { CreateTag, IExtremePointCreateTagOptions } from "../../../Component";

export class ExtremePointCreateTag extends CreateTag<PointsGeometry> {
    private _rectGeometry: RectGeometry;
    private _options: IExtremePointCreateTagOptions;
    private _outline: THREE.Line;

    constructor(
        geometry: PointsGeometry,
        options: IExtremePointCreateTagOptions,
        transform: Transform,
        viewportCoords?: ViewportCoords) {

        super(geometry, transform, viewportCoords);

        this._options = {
            color: options.color == null ? 0xFFFFFF : options.color,
            indicateCompleter: options.indicateCompleter == null ? true : options.indicateCompleter,
        };

        this._rectGeometry = new RectGeometry(this._geometry.getRect2d(transform));
        this._createGlObjects();
    }

    public create(): void {
        if (this._geometry.points.length < 3) {
            return;
        }

        this._geometry.removePoint2d(this._geometry.points.length - 1);
        this._created$.next(this);
    }

    public dispose(): void {
        super.dispose();
        this._disposeObjects();
    }

    public getDOMObjects(camera: THREE.Camera, size: ISize): vd.VNode[] {
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        const vNodes: vd.VNode[] = [];

        const points2d: number[][] = this._geometry.getPoints2d();
        const length: number = points2d.length;

        for (let index: number = 0; index < length - 1; index++) {
            const nonModifiedIndex: number = index;
            const [pointX, pointY]: number[] = points2d[index];
            const pointCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    pointX,
                    pointY,
                    container,
                    this._transform,
                    camera);

            if (!pointCanvas) {
                continue;
            }

            const abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                e.stopPropagation();
                this._aborted$.next(this);
            };

            const remove: (e: MouseEvent) => void = (e: MouseEvent): void => {
                e.stopPropagation();
                this._geometry.removePoint2d(nonModifiedIndex);
            };

            const transform: string = this._canvasToTransform(pointCanvas);
            const completerProperties: vd.createProperties = {
                onclick: index === 0 && length < 3 ? abort : remove,
                style: { transform: transform },
            };

            vNodes.push(vd.h("div.TagInteractor", completerProperties, []));

            const background: string = this._colorToBackground(this._options.color);
            const pointProperties: vd.createProperties = {
                style: {
                    background: background,
                    transform: transform,
                },
            };

            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
        }

        if (length > 2 && this._options.indicateCompleter === true) {
            const [centroidX, centroidY]: number[] = this._geometry.getCentroid2d(this._transform);
            const centroidCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    centroidX,
                    centroidY,
                    container,
                    this._transform,
                    camera);

            if (!!centroidCanvas) {
                const complete: (e: MouseEvent) => void = (e: MouseEvent): void => {
                    e.stopPropagation();
                    this._geometry.removePoint2d(this._geometry.points.length - 1);
                    this._created$.next(this);
                };

                const transform: string = this._canvasToTransform(centroidCanvas);
                const completerProperties: vd.createProperties = {
                    onclick: complete,
                    style: { transform: transform },
                };

                vNodes.push(vd.h("div.TagCompleter.TagLarger", completerProperties, []));

                const pointProperties: vd.createProperties = {
                    style: {
                        background: this._colorToBackground(this._options.color),
                        transform: transform,
                    },
                };

                vNodes.push(vd.h("div.TagVertex.TagLarger", pointProperties, []));

                const dotProperties: vd.createProperties = {
                    style: {
                        transform: transform,
                    },
                };

                vNodes.push(vd.h("div.TagDot", dotProperties, []));
            }
        }

        return vNodes;
    }

    protected _onGeometryChanged(): void {
        this._disposeObjects();

        this._rectGeometry = new RectGeometry(this._geometry.getRect2d(this._transform));
        this._createGlObjects();
    }

    private _createGlObjects(): void {
        this._glObjects = [];

        const polygon3d: number[][] = this._rectGeometry.getPoints3d(this._transform);
        this._outline = this._createOutine(polygon3d, this._options.color);
        this._glObjects.push(this._outline);
    }

    private _disposeObjects(): void {
        this._disposeLine(this._outline);
        this._outline = null;
        this._glObjects = null;
    }
}
