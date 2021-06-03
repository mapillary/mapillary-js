import * as THREE from "three";
import { LngLat } from "../../../api/interfaces/LngLat";
import { SimpleMarkerOptions } from "../interfaces/SimpleMarkerOptions";
import { Marker } from "./Marker";

/**
 * @class SimpleMarker
 *
 * @classdesc Interactive marker with ice cream shape. The sphere
 * inside the ice cream can be configured to be interactive.
 *
 * Simple marker properties can not be updated after creation.
 *
 * To create and add one `SimpleMarker` with default configuration
 * (non-interactive) and one interactive with configuration use
 *
 * @example
 * ```js
 * var defaultMarker = new SimpleMarker(
 *     "id-1",
 *     { lat: 0, lng: 0, });
 *
 * var interactiveMarker = new SimpleMarker(
 *     "id-2",
 *     { lat: 0, lng: 0, },
 *     {
 *         ballColor: "#00f",
 *         ballOpacity: 0.5,
 *         color: "#00f",
 *         interactive: true,
 *         opacity: 0.3,
 *         radius: 0.7,
 *     });
 *
 * markerComponent.add([defaultMarker, interactiveMarker]);
 * ```
 */
export class SimpleMarker extends Marker {
    private _ballColor: number | string;
    private _ballOpacity: number;
    private _circleToRayAngle: number;
    private _color: number | string;
    private _interactive: boolean;
    private _opacity: number;
    private _radius: number;

    constructor(id: string, lngLat: LngLat, options?: SimpleMarkerOptions) {
        super(id, lngLat);

        options = !!options ? options : {};
        this._ballColor = options.ballColor != null ? options.ballColor : 0xff0000;
        this._ballOpacity = options.ballOpacity != null ? options.ballOpacity : 0.8;
        this._circleToRayAngle = 2;
        this._color = options.color != null ? options.color : 0xff0000;
        this._interactive = !!options.interactive;
        this._opacity = options.opacity != null ? options.opacity : 0.4;
        this._radius = options.radius != null ? options.radius : 1;
    }

    protected _createGeometry(position: number[]): void {
        const radius = this._radius;
        const height = this._markerHeight(radius);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: this._color,
            opacity: this._opacity,
            transparent: true,
            depthWrite: false,
        });

        const marker = new THREE.Mesh(
            this._createMarkerGeometry(radius, 8, 8),
            markerMaterial);

        const interactive = new THREE.Mesh(
            new THREE.SphereGeometry(radius / 2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: this._ballColor,
                opacity: this._ballOpacity,
                transparent: true,
            }));
        interactive.position.z = height;

        interactive.renderOrder = 1;

        const group = new THREE.Object3D();
        group.add(interactive);
        group.add(marker);
        group.position.fromArray(position);

        this._geometry = group;
    }

    protected _disposeGeometry(): void {
        for (const mesh of <THREE.Mesh[]>this._geometry.children) {
            mesh.geometry.dispose();
            (<THREE.Material>mesh.material).dispose();
        }
    }

    protected _getInteractiveObjects(): THREE.Object3D[] {
        return this._interactive ? [this._geometry.children[0]] : [];
    }

    private _markerHeight(radius: number): number {
        const t = Math.tan(Math.PI - this._circleToRayAngle);
        return radius * Math.sqrt(1 + t * t);
    }

    private _createMarkerGeometry(
        radius: number,
        widthSegments: number,
        heightSegments: number): THREE.BufferGeometry {

        const height = this._markerHeight(radius);
        const circleToRayAngle = this._circleToRayAngle;

        const indexRows: number[][] = [];
        const positions =
            new Float32Array(3 * (widthSegments + 1) * (heightSegments + 1));
        let positionIndex = 0;
        for (let y = 0; y <= heightSegments; ++y) {
            const indexRow: number[] = [];
            for (let x = 0; x <= widthSegments; ++x) {
                const u = x / widthSegments * Math.PI * 2;
                const v = y / heightSegments * Math.PI;

                let r = radius;
                if (v > circleToRayAngle) {
                    const t = Math.tan(v - circleToRayAngle);
                    r = radius * Math.sqrt(1 + t * t);
                }

                const arrayIndex = 3 * positionIndex;
                const sinv = Math.sin(v);
                positions[arrayIndex + 0] = r * Math.cos(u) * sinv;
                positions[arrayIndex + 1] = r * Math.sin(u) * sinv;
                positions[arrayIndex + 2] = r * Math.cos(v) + height;
                indexRow.push(positionIndex++);
            }

            indexRows.push(indexRow);
        }

        const indices = new Uint16Array(6 * widthSegments * heightSegments);
        let index = 0;
        for (let y = 0; y < heightSegments; ++y) {
            for (let x = 0; x < widthSegments; ++x) {
                const pi1 = indexRows[y][x + 1];
                const pi2 = indexRows[y][x];
                const pi3 = indexRows[y + 1][x];
                const pi4 = indexRows[y + 1][x + 1];

                indices[index++] = pi1;
                indices[index++] = pi2;
                indices[index++] = pi4;
                indices[index++] = pi2;
                indices[index++] = pi3;
                indices[index++] = pi4;
            }
        }

        const geometry = new THREE.BufferGeometry();
        const positionAttribute = new THREE.BufferAttribute(positions, 3);
        geometry.setAttribute("position", positionAttribute);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        return geometry;
    }
}
