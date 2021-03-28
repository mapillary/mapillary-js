import * as THREE from "three";

import { Unprojection } from "./interfaces/Unprojection";

import { LngLat } from "../api/interfaces/LngLat";
import { Spatial } from "../geo/Spatial";
import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { LatLonAlt } from "../api/interfaces/LatLonAlt";
import { RenderCamera } from "../render/RenderCamera";
import { enuToGeodetic, geodeticToEnu } from "../geo/GeoCoords";

export class Projection {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    constructor(viewportCoords?: ViewportCoords, spatial?: Spatial) {
        this._spatial = !!spatial ? spatial : new Spatial();
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();
    }

    public basicToCanvas(
        basicPoint: number[],
        container: HTMLElement,
        render: RenderCamera,
        transform: Transform): number[] {

        return this._viewportCoords
            .basicToCanvasSafe(basicPoint[0], basicPoint[1], container, transform, render.perspective);
    }

    public canvasToBasic(
        canvasPoint: number[],
        container: HTMLElement,
        render: RenderCamera,
        transform: Transform): number[] {

        let basicPoint: number[] = this._viewportCoords
            .canvasToBasic(canvasPoint[0], canvasPoint[1], container, transform, render.perspective);

        if (basicPoint[0] < 0 || basicPoint[0] > 1 || basicPoint[1] < 0 || basicPoint[1] > 1) {
            basicPoint = null;
        }

        return basicPoint;
    }

    public eventToUnprojection(
        event: MouseEvent | Touch,
        container: HTMLElement,
        render: RenderCamera,
        reference: LatLonAlt,
        transform: Transform): Unprojection {

        const pixelPoint: number[] = this._viewportCoords.canvasPosition(event, container);

        return this.canvasToUnprojection(pixelPoint, container, render, reference, transform);
    }

    public canvasToUnprojection(
        canvasPoint: number[],
        container: HTMLElement,
        render: RenderCamera,
        reference: LatLonAlt,
        transform: Transform): Unprojection {

        const canvasX: number = canvasPoint[0];
        const canvasY: number = canvasPoint[1];

        const [viewportX, viewportY]: number[] =
            this._viewportCoords.canvasToViewport(canvasX, canvasY, container);

        const point3d: THREE.Vector3 = new THREE.Vector3(viewportX, viewportY, 1)
            .unproject(render.perspective);

        let basicPoint: number[] = transform.projectBasic(point3d.toArray());
        if (basicPoint[0] < 0 || basicPoint[0] > 1 || basicPoint[1] < 0 || basicPoint[1] > 1) {
            basicPoint = null;
        }

        const direction3d: THREE.Vector3 = point3d.clone().sub(render.camera.position).normalize();
        const dist: number = -2 / direction3d.z;

        let lngLat: LngLat = null;
        if (dist > 0 && dist < 100 && !!basicPoint) {
            const point: THREE.Vector3 = direction3d.clone().multiplyScalar(dist).add(render.camera.position);
            const lngLatArray: number[] = enuToGeodetic(
                point.x,
                point.y,
                point.z,
                reference.lat,
                reference.lng,
                reference.alt)
                .slice(0, 2);

            lngLat = { lat: lngLatArray[0], lng: lngLatArray[1] };
        }

        const unprojection: Unprojection = {
            basicPoint: basicPoint,
            lngLat: lngLat,
            pixelPoint: [canvasX, canvasY],
        };

        return unprojection;
    }

    public cameraToLngLat(render: RenderCamera, reference: LatLonAlt): LngLat {
        const position: THREE.Vector3 = render.camera.position;
        const [lat, lon]: number[] = enuToGeodetic(
            position.x,
            position.y,
            position.z,
            reference.lat,
            reference.lng,
            reference.alt);

        return { lat: lat, lng: lon };
    }

    public lngLatToCanvas(
        lngLat: LngLat,
        container: HTMLElement,
        render: RenderCamera,
        reference: LatLonAlt): number[] {

        const point3d: number[] = geodeticToEnu(
            lngLat.lat,
            lngLat.lng,
            0,
            reference.lat,
            reference.lng,
            reference.alt);

        const canvas: number[] = this._viewportCoords.projectToCanvasSafe(
            point3d,
            container,
            render.perspective);

        return canvas;
    }

    public distanceBetweenLatLons(lngLat1: LngLat, lngLat2: LngLat): number {
        return this._spatial.distanceFromLatLon(
            lngLat1.lat,
            lngLat1.lng,
            lngLat2.lat,
            lngLat2.lng);
    }
}
