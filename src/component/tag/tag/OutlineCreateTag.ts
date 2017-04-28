/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    IOutlineCreateTagOptions,
    PolygonGeometry,
    RectGeometry,
    VertexGeometry,
} from "../../../Component";
import {Transform} from "../../../Geo";

export class OutlineCreateTag {
    private _geometry: VertexGeometry;
    private _options: IOutlineCreateTagOptions;

    private _created$: Subject<OutlineCreateTag>;
    private _aborted$: Subject<OutlineCreateTag>;

    constructor(geometry: VertexGeometry, options: IOutlineCreateTagOptions) {
        this._geometry = geometry;
        this._options = { color: options.color == null ? 0xFFFFFF : options.color };

        this._created$ = new Subject<OutlineCreateTag>();
        this._aborted$ = new Subject<OutlineCreateTag>();
    }

    public get geometry(): VertexGeometry {
        return this._geometry;
    }

    public get created$(): Observable<OutlineCreateTag> {
        return this._created$;
    }

    public get aborted$(): Observable<OutlineCreateTag> {
        return this._aborted$;
    }

    public get geometryChanged$(): Observable<OutlineCreateTag> {
        return this._geometry.changed$
            .map(
                (geometry: VertexGeometry): OutlineCreateTag => {
                    return this;
                });
    }

    public getGLObject(transform: Transform): THREE.Object3D {
        let polygon3d: number[][] = this._geometry.getPoints3d(transform);
        let positions: Float32Array = this._getPositions(polygon3d);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial(
                {
                    color: this._options.color,
                    linewidth: 1,
                });

        return new THREE.Line(geometry, material);
    }

    public getDOMObjects(
        transform: Transform,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[] {

        let vNodes: vd.VNode[] = [];
        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            e.stopPropagation();
            this._aborted$.next(this);
        };

        if (this._geometry instanceof RectGeometry) {
            let topLeftPoint3d: number[] = this._geometry.getVertex3d(1, transform);

            let topLeftCameraSpace: THREE.Vector3 = this._convertToCameraSpace(topLeftPoint3d, matrixWorldInverse);
            if (topLeftCameraSpace.z < 0) {
                let centerCanvas: number[] = this._projectToCanvas(topLeftCameraSpace, projectionMatrix);
                let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let pointProperties: vd.createProperties = {
                    style: {
                        background: "#" + ("000000" + this._options.color.toString(16)).substr(-6),
                        left: centerCss[0],
                        position: "absolute",
                        top: centerCss[1],
                    },
                };

                let completerProperties: vd.createProperties = {
                    onclick: abort,
                    style: { left: centerCss[0], position: "absolute", top: centerCss[1] },
                };

                vNodes.push(vd.h("div.TagInteractor", completerProperties, []));
                vNodes.push(vd.h("div.TagVertex", pointProperties, []));
            }
        } else if (this._geometry instanceof PolygonGeometry) {
            let polygonGeometry: PolygonGeometry = <PolygonGeometry>this._geometry;

            let firstVertex3d: number[] = this._geometry.getVertex3d(0, transform);
            let firstCameraSpace: THREE.Vector3 = this._convertToCameraSpace(firstVertex3d, matrixWorldInverse);
            if (firstCameraSpace.z < 0) {
                let centerCanvas: number[] = this._projectToCanvas(firstCameraSpace, projectionMatrix);
                let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let firstOnclick: (e: MouseEvent) => void = polygonGeometry.polygon.length > 4 ?
                    (e: MouseEvent): void => {
                        e.stopPropagation();
                        polygonGeometry.removeVertex2d(polygonGeometry.polygon.length - 2);
                        this._created$.next(this);
                    } :
                    abort;

                let completerProperties: vd.createProperties = {
                    onclick: firstOnclick,
                    style: { left: centerCss[0], position: "absolute", top: centerCss[1] },
                };

                let firstClass: string = polygonGeometry.polygon.length > 4 ?
                    "TagCompleter" :
                    "TagInteractor";

                vNodes.push(vd.h("div." + firstClass, completerProperties, []));
            }

            if (polygonGeometry.polygon.length > 3) {
                let lastVertex3d: number[] = this._geometry.getVertex3d(polygonGeometry.polygon.length - 3, transform);

                let lastCameraSpace: THREE.Vector3 = this._convertToCameraSpace(lastVertex3d, matrixWorldInverse);
                if (lastCameraSpace.z < 0) {
                    let centerCanvas: number[] = this._projectToCanvas(lastCameraSpace, projectionMatrix);
                    let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                    let remove: (e: MouseEvent) => void = (e: MouseEvent): void => {
                        e.stopPropagation();
                        polygonGeometry.removeVertex2d(polygonGeometry.polygon.length - 3);
                    };

                    let completerProperties: vd.createProperties = {
                        onclick: remove,
                        style: { left: centerCss[0], position: "absolute", top: centerCss[1] },
                    };

                    vNodes.push(vd.h("div.TagInteractor", completerProperties, []));
                }
            }

            let vertices3d: number[][] = this._geometry.getVertices3d(transform);
            vertices3d.splice(-2, 2);

            for (let vertex of vertices3d) {
                let vertexCameraSpace: THREE.Vector3 = this._convertToCameraSpace(vertex, matrixWorldInverse);
                if (vertexCameraSpace.z < 0) {
                    let centerCanvas: number[] = this._projectToCanvas(vertexCameraSpace, projectionMatrix);
                    let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                    let pointProperties: vd.createProperties = {
                        style: {
                            background: "#" + ("000000" + this._options.color.toString(16)).substr(-6),
                            left: centerCss[0],
                            position: "absolute",
                            top: centerCss[1],
                        },
                    };

                    vNodes.push(vd.h("div.TagVertex", pointProperties, []));
                }
            }
        }

        return vNodes;
    }

    public addPoint(point: number[]): void {
        if (this._geometry instanceof RectGeometry) {
            let rectGeometry: RectGeometry = <RectGeometry>this._geometry;

            if (!rectGeometry.validate(point)) {
                return;
            }

            this._created$.next(this);
        } else if (this._geometry instanceof PolygonGeometry) {
            let polygonGeometry: PolygonGeometry = <PolygonGeometry>this._geometry;

            polygonGeometry.addVertex2d(point);
        }
    }

    private _getPositions(polygon3d: number[][]): Float32Array {
        let length: number = polygon3d.length;
        let positions: Float32Array = new Float32Array(length * 3);

        for (let i: number = 0; i < length; ++i) {
            let index: number = 3 * i;

            let position: number[] = polygon3d[i];

            positions[index] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }

    private _projectToCanvas(
        point: THREE.Vector3,
        projectionMatrix: THREE.Matrix4):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point.x, point.y, point.z)
                .applyMatrix4(projectionMatrix);

        return [(projected.x + 1) / 2, (-projected.y + 1) / 2];
    }

    private _convertToCameraSpace(
        point: number[],
        matrixWorldInverse: THREE.Matrix4):
        THREE.Vector3 {

        return new THREE.Vector3(point[0], point[1], point[2]).applyMatrix4(matrixWorldInverse);
    }
}

export default OutlineCreateTag;
