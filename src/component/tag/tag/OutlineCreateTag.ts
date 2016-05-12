/// <reference path="../../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as vd from "virtual-dom";

import {Geometry, RectGeometry} from "../../../Component";
import {Transform} from "../../../Geo";

export class OutlineCreateTag {
    private _geometry: Geometry;

    private _created$: rx.Subject<OutlineCreateTag>;
    private _aborted$: rx.Subject<OutlineCreateTag>;

    constructor(geometry: Geometry) {
        this._geometry = geometry;

        this._created$ = new rx.Subject<OutlineCreateTag>();
        this._aborted$ = new rx.Subject<OutlineCreateTag>();
    }

    public get geometry(): Geometry {
        return this._geometry;
    }

    public get created$(): rx.Observable<OutlineCreateTag> {
        return this._created$;
    }

    public get aborted$(): rx.Observable<OutlineCreateTag> {
        return this._aborted$;
    }

    public get geometryChanged$(): rx.Observable<OutlineCreateTag> {
        return this._geometry.changed$
            .map<OutlineCreateTag>(
                (geometry: Geometry): OutlineCreateTag => {
                    return this;
                });
    }

    public getGLObject(transform: Transform): THREE.Object3D {
        let polygon3d: number[][] = this._geometry.getPolygon3d(transform);
        let positions: Float32Array = this._getPositions(polygon3d);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial(
                {
                    color: 0xFFFFFF,
                    linewidth: 2,
                });

        return new THREE.Line(geometry, material);
    }

    public getDOMObjects(
        transform: Transform,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[] {

        let vNodes: vd.VNode[] = [];
        let polygonPoints3d: number[][] = this._geometry.getPolygonPoints3d(transform);

        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._aborted$.onNext(this);
        };

        let topLeftCameraSpace: THREE.Vector3 = this._convertToCameraSpace(polygonPoints3d[1], matrixWorldInverse);
        if (topLeftCameraSpace.z < 0) {
            let centerCanvas: number[] = this._projectToCanvas(topLeftCameraSpace, projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let pointProperties: vd.createProperties = {
                style: { background: "#FFFFFF", left: centerCss[0], position: "absolute", top: centerCss[1] },
            };

            let completerProperties: vd.createProperties = {
                onclick: abort,
                style: { left: centerCss[0], position: "absolute", top: centerCss[1] },
            };

            vNodes.push(vd.h("div.TagPolygonCompleter", completerProperties, []));
            vNodes.push(vd.h("div.TagPolygonPoint", pointProperties, []));
        }

        return vNodes;
    }

    public addPoint(point: number[]): void {
        let rectGeometry: RectGeometry = <RectGeometry>this._geometry;

        if (!rectGeometry.validate(point)) {
            return;
        }

        this._created$.onNext(this);
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
                .applyProjection(projectionMatrix);

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
