import {first} from "rxjs/operators";
import {Subscription} from "rxjs";

import {ILatLon} from "../../../src/API";
import {
    Marker,
    MarkerSet,
} from "../../../src/Component";

class TestMarker extends Marker {
    constructor(id: string, latLon: ILatLon) { super(id, latLon); }
    protected _createGeometry(position: number[]): void { /* noop */ }
    protected _disposeGeometry(): void { /* noop */ }
    protected _getInteractiveObjects(): THREE.Object3D[] { return []; }
}

describe("MarkerSet.ctor", () => {
    it("should be defined", () => {
        let markerSet: MarkerSet = new MarkerSet();

        expect(markerSet).toBeDefined();
    });
});

describe("MarkerSet.get", () => {
    it("should return undefined when marker does not exist", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let result: Marker = markerSet.get("non-existant-id");

        expect(result).toBeUndefined();
    });
});

describe("MarkerSet.add", () => {
    it("should add a single marker", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        markerSet.add([marker]);

        let result: Marker = markerSet.get(marker.id);
        expect(result).toBe(marker);
        expect(result.id).toBe(marker.id);
        expect(result.latLon.lat).toBe(marker.latLon.lat);
        expect(result.latLon.lon).toBe(marker.latLon.lon);
    });

    it("should add multiple markers", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker1: TestMarker = new TestMarker("id1", { lat: 1, lon: 1 });
        let marker2: TestMarker = new TestMarker("id2", { lat: 2, lon: 2 });

        markerSet.add([marker1, marker2]);

        let result1: Marker = markerSet.get(marker1.id);
        expect(result1).toBe(marker1);
        expect(result1.id).toBe(marker1.id);
        expect(result1.latLon.lat).toBe(marker1.latLon.lat);
        expect(result1.latLon.lon).toBe(marker1.latLon.lon);

        let result2: Marker = markerSet.get(marker2.id);
        expect(result2).toBe(marker2);
        expect(result2.id).toBe(marker2.id);
        expect(result2.latLon.lat).toBe(marker2.latLon.lat);
        expect(result2.latLon.lon).toBe(marker2.latLon.lon);
    });

    it("should replace when marker with id exist", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let id: string = "original-id";
        let originalMarker: TestMarker = new TestMarker(id, { lat: 0, lon: 0 });
        markerSet.add([originalMarker]);

        let newMarker: TestMarker = new TestMarker(id, { lat: 1, lon: 1 });
        markerSet.add([newMarker]);

        let result: Marker = markerSet.get(id);
        expect(result).not.toBe(originalMarker);
        expect(result).toBe(newMarker);
        expect(result.id).toBe(id);
        expect(result.latLon.lat).toBe(newMarker.latLon.lat);
        expect(result.latLon.lon).toBe(newMarker.latLon.lon);
    });

    it("should replace and update index when marker with id exist", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let id: string = "original-id";
        let originalMarker: TestMarker = new TestMarker(id, { lat: 0, lon: 0 });
        markerSet.add([originalMarker]);

        let newMarker: TestMarker = new TestMarker(id, { lat: 1, lon: 1 });
        markerSet.add([newMarker]);

        let originalResult: Marker[] = markerSet.search([
            { lat: -0.5, lon: -0.5 },
            { lat: 0.5, lon: 0.5 },
        ]);
        expect(originalResult.length).toBe(0);

        let updatedResult: Marker[] = markerSet.search([
            { lat: 0.5, lon: 0.5 },
            { lat: 1.5, lon: 1.5 },
        ]);
        expect(updatedResult.length).toBe(1);
        expect(updatedResult[0].id).toBe(id);
        expect(updatedResult[0].latLon.lat).toBe(newMarker.latLon.lat);
        expect(updatedResult[0].latLon.lon).toBe(newMarker.latLon.lon);
    });
});

describe("MarkerSet.getAll", () => {
    it("should return a single marker", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        markerSet.add([marker]);

        let result: Marker[] = markerSet.getAll();
        expect(result.length).toBe(1);
        expect(result[0]).toBe(marker);
        expect(result[0].id).toBe(marker.id);
    });

    it("should return multiple markers", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker1: TestMarker = new TestMarker("id1", { lat: 0, lon: 0 });
        let marker2: TestMarker = new TestMarker("id2", { lat: 0, lon: 0 });

        markerSet.add([marker1, marker2]);

        let result: Marker[] = markerSet.getAll();
        expect(result.length).toBe(2);

        let marker1Found: boolean = false;
        let marker2Found: boolean = false;
        for (let marker of result) {
            if (marker.id === marker1.id) {
                marker1Found = true;
            } else if (marker.id === marker2.id) {
                marker2Found = true;
            }
        }

        expect(marker1Found).toBe(true);
        expect(marker2Found).toBe(true);
    });
});

describe("MarkerSet.has", () => {
    it("should have an added marker", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        markerSet.add([marker]);

        expect(markerSet.has(marker.id)).toBe(true);
    });

    it("should not have a non existant marker", () => {
        let markerSet: MarkerSet = new MarkerSet();

        expect(markerSet.has("non-existant-id")).toBe(false);
    });
});

describe("MarkerSet.remove", () => {
    it("should remove a single marker", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        markerSet.add([marker]);
        markerSet.remove([marker.id]);

        let result: Marker = markerSet.get(marker.id);
        expect(result).toBe(undefined);
    });

    it("should remove multiple markers", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker1: TestMarker = new TestMarker("id1", { lat: 1, lon: 1 });
        let marker2: TestMarker = new TestMarker("id2", { lat: 2, lon: 2 });

        markerSet.add([marker1, marker2]);
        markerSet.remove([marker1.id, marker2.id]);

        let result1: Marker = markerSet.get(marker1.id);
        expect(result1).toBe(undefined);

        let result2: Marker = markerSet.get(marker2.id);
        expect(result2).toBe(undefined);
    });

    it("should remove a single out of multiple markers", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker1: TestMarker = new TestMarker("id1", { lat: 1, lon: 1 });
        let marker2: TestMarker = new TestMarker("id2", { lat: 2, lon: 2 });

        markerSet.add([marker1, marker2]);
        markerSet.remove([marker1.id]);

        let result1: Marker = markerSet.get(marker1.id);
        expect(result1).toBe(undefined);

        let result2: Marker = markerSet.get(marker2.id);
        expect(result2.id).toBe(marker2.id);
    });

    it("should not have effect if id does not exist", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker: TestMarker = new TestMarker("id", { lat: 1, lon: 1 });

        markerSet.add([marker]);
        markerSet.remove(["other-id"]);

        let result: Marker = markerSet.get(marker.id);
        expect(result.id).toBe(marker.id);
    });
});

describe("MarkerSet.removeAll", () => {
    it("should remove a single marker", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        markerSet.add([marker]);
        markerSet.removeAll();

        let result: Marker = markerSet.get(marker.id);
        expect(result).toBe(undefined);

        let allResult: Marker[] = markerSet.getAll();
        expect(allResult.length).toBe(0);
    });

    it("should remove multiple markers", () => {
        let markerSet: MarkerSet = new MarkerSet();
        let marker1: TestMarker = new TestMarker("id1", { lat: 1, lon: 1 });
        let marker2: TestMarker = new TestMarker("id2", { lat: 2, lon: 2 });

        markerSet.add([marker1, marker2]);
        markerSet.removeAll();

        let result1: Marker = markerSet.get(marker1.id);
        expect(result1).toBe(undefined);

        let result2: Marker = markerSet.get(marker2.id);
        expect(result2).toBe(undefined);

        let allResult: Marker[] = markerSet.getAll();
        expect(allResult.length).toBe(0);
    });
});

describe("MarkerSet.update", () => {
    it("should replace the original marker", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let id: string = "id";
        let originalMarker: TestMarker = new TestMarker(id, { lat: 0, lon: 0 });
        markerSet.add([originalMarker]);

        let updatedMarker: TestMarker = new TestMarker(id, { lat: 1, lon: 1 });
        markerSet.update(updatedMarker);

        let result: Marker = markerSet.get(id);
        expect(result).not.toBe(originalMarker);
        expect(result).toBe(updatedMarker);
        expect(result.latLon.lat).toBe(updatedMarker.latLon.lat);
        expect(result.latLon.lon).toBe(updatedMarker.latLon.lon);
    });

    it("should replace the original marker and update index", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let id: string = "id";
        let originalMarker: TestMarker = new TestMarker(id, { lat: 0, lon: 0 });
        markerSet.add([originalMarker]);

        let updatedMarker: TestMarker = new TestMarker(id, { lat: 1, lon: 1 });
        markerSet.update(updatedMarker);

        let originalResult: Marker[] = markerSet.search([
            { lat: -0.5, lon: -0.5 },
            { lat: 0.5, lon: 0.5 },
        ]);
        expect(originalResult.length).toBe(0);

        let updatedResult: Marker[] = markerSet.search([
            { lat: 0.5, lon: 0.5 },
            { lat: 1.5, lon: 1.5 },
        ]);
        expect(updatedResult.length).toBe(1);
        expect(updatedResult[0].id).toBe(id);
        expect(updatedResult[0].latLon.lat).toBe(updatedMarker.latLon.lat);
        expect(updatedResult[0].latLon.lon).toBe(updatedMarker.latLon.lon);
    });
});

describe("MarkerSet.changed$", () => {
    it("should emit when adding marker", (done: Function) => {
        let markerSet: MarkerSet = new MarkerSet();

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        markerSet.changed$.pipe(
            first())
            .subscribe(
                (ms: MarkerSet): void => {
                    let result: Marker = ms.get(marker.id);
                    expect(result).toBe(marker);
                    done();
                });

        markerSet.add([marker]);
    });

    it("should not emit when all added markers already exist", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });
        markerSet.add([marker]);

        let hasEmitted: boolean = false;
        let subscription: Subscription = markerSet.changed$
            .subscribe(
                (ms: MarkerSet): void => {
                    hasEmitted = true;
                });

        markerSet.add([marker]);

        subscription.unsubscribe();

        expect(hasEmitted).toBe(false);
    });

    it("should emit when removing marker", (done: Function) => {
        let markerSet: MarkerSet = new MarkerSet();

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });
        markerSet.add([marker]);

        markerSet.changed$.pipe(
            first())
            .subscribe(
                (ms: MarkerSet): void => {
                    let result: Marker = ms.get(marker.id);
                    expect(result).toBeUndefined();
                    done();
                });

        markerSet.remove([marker.id]);
    });

    it("should not emit when removing non existant marker", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let hasEmitted: boolean = false;
        let subscription: Subscription = markerSet.changed$
            .subscribe(
                (ms: MarkerSet): void => {
                    hasEmitted = true;
                });

        markerSet.remove(["non-existant-id"]);

        subscription.unsubscribe();

        expect(hasEmitted).toBe(false);
    });
});

describe("MarkerSet.updated$", () => {
    it("should emit not when adding a new marker", () => {
        let markerSet: MarkerSet = new MarkerSet();

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        let hasEmitted: boolean = false;
        markerSet.updated$.pipe(
            first())
            .subscribe(
                (ms: Marker[]): void => {
                    hasEmitted = true;
                });

        markerSet.add([marker]);

        expect(hasEmitted).toBe(false);
    });

    it("should emit when adding an existing marker", (done: Function) => {
        let markerSet: MarkerSet = new MarkerSet();

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });
        markerSet.add([marker]);

        markerSet.updated$.pipe(
            first())
            .subscribe(
                (ms: Marker[]): void => {
                    expect(ms.length).toBe(1);
                    expect(ms[0]).toBe(marker);
                    expect(ms[0].id).toBe(marker.id);
                    done();
                });

        markerSet.add([marker]);
    });

    it("should emit to both updated and changed", (done: Function) => {
        let markerSet: MarkerSet = new MarkerSet();

        let marker1: TestMarker = new TestMarker("id1", { lat: 0, lon: 0 });
        markerSet.add([marker1]);

        let marker2: TestMarker = new TestMarker("id2", { lat: 0, lon: 0 });

        let firstDone: boolean = false;
        markerSet.updated$.pipe(
            first())
            .subscribe(
                (ms: Marker[]): void => {
                    expect(ms.length).toBe(1);
                    expect(ms[0]).toBe(marker1);
                    expect(ms[0].id).toBe(marker1.id);
                    if (firstDone) {
                        done();
                    } else {
                        firstDone = true;
                    }
                });

        markerSet.changed$.pipe(
            first())
            .subscribe(
                (ms: MarkerSet): void => {
                    let result: Marker = ms.get(marker2.id);
                    expect(result).toBe(marker2);
                    if (firstDone) {
                        done();
                    } else {
                        firstDone = true;
                    }
                });

        markerSet.add([marker1, marker2]);
    });
});
