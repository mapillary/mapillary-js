/// <reference path="../../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {Geometry} from "../../../Component";
import {Transform} from "../../../Geo";

export class CreateLineTag {
    private _geometry: Geometry;

    private _created$: rx.Subject<CreateLineTag>;

    constructor(geometry: Geometry) {
        this._geometry = geometry;

        this._created$ = new rx.Subject<CreateLineTag>();
    }

    public get geometry(): Geometry {
        return this._geometry;
    }

    public get created$(): rx.Observable<CreateLineTag> {
        return this._created$;
    }

    public get geometryChanged$(): rx.Observable<CreateLineTag> {
        return this._geometry.changed$
            .map<CreateLineTag>(
                (geometry: Geometry): CreateLineTag => {
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

    public addPoint(point: number[]): void {
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
}

export default CreateLineTag;
