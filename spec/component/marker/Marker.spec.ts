import * as THREE from "three";

import {ILatLon} from "../../../src/API";
import {
    Marker,
} from "../../../src/Component";

class TestMarker extends Marker {
    constructor(id: string, latLon: ILatLon) { super(id, latLon); }
    protected _createGeometry(position: number[]): void {
        this._geometry = new THREE.Object3D();
        this._geometry.position.fromArray(position);
    }

    protected _disposeGeometry(): void { /* noop */ }
    protected _getInteractiveObjects(): THREE.Object3D[] { return [this._geometry]; }
}

describe("Marker.ctor", () => {
    it("should be defined", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });

        expect(marker).toBeDefined();
        expect(marker.id).toBe("id");
        expect(marker.latLon.lat).toBe(1);
        expect(marker.latLon.lon).toBe(2);
    });
});

describe("Marker.createGeometry", () => {
    it("geometry should be defined", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });
        marker.createGeometry([0, 0, 0]);

        expect(marker.geometry).toBeDefined();
    });

    it("geometry should not create a new geometry", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });
        marker.createGeometry([0, 0, 0]);

        let uuid: string = marker.geometry.uuid;

        marker.createGeometry([0, 0, 0]);

        expect(marker.geometry.uuid).toBe(uuid);
    });
});

describe("Marker.disposeGeometry", () => {
    it("geometry should be null", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });
        marker.createGeometry([0, 0, 0]);
        marker.disposeGeometry();

        expect(marker.geometry).toBeUndefined();
    });
});

describe("Marker.getInteractiveObjectIds", () => {
    it("should return empty array if geometry not defined", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });
        let objects: THREE.Object3D[] = marker.getInteractiveObjects();

        expect(objects.length).toBe(0);
    });

    it("should return object ids when geometry created", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });
        marker.createGeometry([0, 0, 0]);
        let objects: THREE.Object3D[] = marker.getInteractiveObjects();

        expect(objects.length).toBe(1);
        expect(objects[0].uuid).toBe(marker.geometry.uuid);
    });
});

describe("Marker.updatePosition", () => {
    it("should update geometry position", () => {
        let marker: Marker = new TestMarker("id", { lat: 1, lon: 2 });
        marker.createGeometry([0, 1, 2]);

        expect(marker.geometry.position.x).toBe(0);
        expect(marker.geometry.position.y).toBe(1);
        expect(marker.geometry.position.z).toBe(2);

        marker.updatePosition([1, 2, 3]);

        expect(marker.geometry.position.x).toBe(1);
        expect(marker.geometry.position.y).toBe(2);
        expect(marker.geometry.position.z).toBe(3);
    });

    it("should update lat lon", () => {
        let marker: Marker = new TestMarker("id", { lat: 0, lon: 0 });
        marker.createGeometry([0, 0, 0]);
        marker.updatePosition([1, 2, 3], { lat: 1, lon: 2 });

        expect(marker.latLon.lat).toBe(1);
        expect(marker.latLon.lon).toBe(2);
    });
});
