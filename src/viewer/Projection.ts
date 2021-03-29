import * as THREE from "three";

import { LngLat } from "../api/interfaces/LngLat";
import { Spatial } from "../geo/Spatial";
import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { RenderCamera } from "../render/RenderCamera";
import {
    enuToGeodetic,
    geodeticToEnu,
} from "../geo/GeoCoords";
import { Unprojection } from "./interfaces/Unprojection";

export class Projection {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    constructor(viewportCoords?: ViewportCoords, spatial?: Spatial) {
        this._spatial = spatial ?? new Spatial();
        this._viewportCoords = viewportCoords ?? new ViewportCoords();
    }

    public basicToCanvas(
        basicPoint: number[],
        container: HTMLElement,
        render: RenderCamera,
        transform: Transform)
        : number[] {

        return this._viewportCoords
            .basicToCanvasSafe(
                basicPoint[0],
                basicPoint[1],
                container,
                transform,
                render.perspective);
    }

    public canvasToBasic(
        canvasPoint: number[],
        container: HTMLElement,
        render: RenderCamera,
        transform: Transform)
        : number[] {

        let basicPoint = this._viewportCoords
            .canvasToBasic(
                canvasPoint[0],
                canvasPoint[1],
                container,
                transform,
                render.perspective);

        if (basicPoint[0] < 0 ||
            basicPoint[0] > 1 ||
            basicPoint[1] < 0 ||
            basicPoint[1] > 1) {
            basicPoint = null;
        }

        return basicPoint;
    }

    public eventToUnprojection(
        event: MouseEvent | Touch,
        container: HTMLElement,
        render: RenderCamera,
        reference: LngLatAlt,
        transform: Transform)
        : Unprojection {

        const pixelPoint = this._viewportCoords
            .canvasPosition(event, container);

        return this.canvasToUnprojection(
            pixelPoint,
            container,
            render,
            reference,
            transform);
    }

    public canvasToUnprojection(
        canvasPoint: number[],
        container: HTMLElement,
        render: RenderCamera,
        reference: LngLatAlt,
        transform: Transform)
        : Unprojection {

        const canvasX = canvasPoint[0];
        const canvasY = canvasPoint[1];

        const [viewportX, viewportY] =
            this._viewportCoords
                .canvasToViewport(
                    canvasX,
                    canvasY,
                    container);

        const point3d = new THREE.Vector3(viewportX, viewportY, 1)
            .unproject(render.perspective);

        let basicPoint = transform
            .projectBasic(point3d.toArray());

        if (basicPoint[0] < 0 ||
            basicPoint[0] > 1 ||
            basicPoint[1] < 0 ||
            basicPoint[1] > 1) {
            basicPoint = null;
        }

        const direction3d = point3d
            .clone()
            .sub(render.camera.position)
            .normalize();

        const dist = -2 / direction3d.z;

        let lngLat: LngLat = null;
        if (dist > 0 && dist < 100 && !!basicPoint) {
            const point = direction3d
                .clone()
                .multiplyScalar(dist)
                .add(render.camera.position);

            const [lng, lat] = enuToGeodetic(
                point.x,
                point.y,
                point.z,
                reference.lng,
                reference.lat,
                reference.alt);

            lngLat = { lat, lng };
        }

        const unprojection: Unprojection = {
            basicPoint: basicPoint,
            lngLat: lngLat,
            pixelPoint: [canvasX, canvasY],
        };

        return unprojection;
    }

    public cameraToLngLat(render: RenderCamera, reference: LngLatAlt): LngLat {
        const position = render.camera.position;
        const [lng, lat] = enuToGeodetic(
            position.x,
            position.y,
            position.z,
            reference.lng,
            reference.lat,
            reference.alt);

        return { lat, lng };
    }

    public lngLatToCanvas(
        lngLat: LngLat,
        container: HTMLElement,
        render: RenderCamera,
        reference: LngLatAlt): number[] {

        const point3d = geodeticToEnu(
            lngLat.lng,
            lngLat.lat,
            0,
            reference.lng,
            reference.lat,
            reference.alt);

        const canvas = this._viewportCoords
            .projectToCanvasSafe(
                point3d,
                container,
                render.perspective);

        return canvas;
    }

    public distanceBetweenLngLats(lngLat1: LngLat, lngLat2: LngLat): number {
        return this._spatial
            .distanceFromLngLat(
                lngLat1.lng,
                lngLat1.lat,
                lngLat2.lng,
                lngLat2.lat);
    }
}
