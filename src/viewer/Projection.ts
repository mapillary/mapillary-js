import * as THREE from "three";

import { Unprojection } from "./interfaces/Unprojection";

import { LatLon } from "../api/interfaces/LatLon";
import { GeoCoords } from "../geo/GeoCoords";
import { Spatial } from "../geo/Spatial";
import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { LatLonAlt } from "../api/interfaces/LatLonAlt";
import { RenderCamera } from "../render/RenderCamera";

export class Projection {
    private _geoCoords: GeoCoords;
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    constructor(geoCoords?: GeoCoords, viewportCoords?: ViewportCoords, spatial?: Spatial) {
        this._geoCoords = !!geoCoords ? geoCoords : new GeoCoords();
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

        let latLon: LatLon = null;
        if (dist > 0 && dist < 100 && !!basicPoint) {
            const point: THREE.Vector3 = direction3d.clone().multiplyScalar(dist).add(render.camera.position);
            const latLonArray: number[] = this._geoCoords
                .enuToGeodetic(
                    point.x,
                    point.y,
                    point.z,
                    reference.lat,
                    reference.lon,
                    reference.alt)
                .slice(0, 2);

            latLon = { lat: latLonArray[0], lon: latLonArray[1] };
        }

        const unprojection: Unprojection = {
            basicPoint: basicPoint,
            latLon: latLon,
            pixelPoint: [canvasX, canvasY],
        };

        return unprojection;
    }

    public cameraToLatLon(render: RenderCamera, reference: LatLonAlt): LatLon {
        const position: THREE.Vector3 = render.camera.position;
        const [lat, lon]: number[] = this._geoCoords.enuToGeodetic(
            position.x,
            position.y,
            position.z,
            reference.lat,
            reference.lon,
            reference.alt);

        return { lat: lat, lon: lon };
    }

    public latLonToCanvas(
        latLon: LatLon,
        container: HTMLElement,
        render: RenderCamera,
        reference: LatLonAlt): number[] {

        const point3d: number[] = this._geoCoords.geodeticToEnu(
            latLon.lat,
            latLon.lon,
            0,
            reference.lat,
            reference.lon,
            reference.alt);

        const canvas: number[] = this._viewportCoords.projectToCanvasSafe(
            point3d,
            container,
            render.perspective);

        return canvas;
    }

    public distanceBetweenLatLons(latLon1: LatLon, latLon2: LatLon): number {
        return this._spatial.distanceFromLatLon(
            latLon1.lat,
            latLon1.lon,
            latLon2.lat,
            latLon2.lon);
    }
}
