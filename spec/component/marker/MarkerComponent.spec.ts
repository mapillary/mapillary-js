/// <reference path="../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";

import {
    SimpleMarker,
    Marker,
    MarkerComponent,
} from "../../../src/Component";
import {Container} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

describe("MarkerComponent", () => {
    let markerComponent: MarkerComponent;

    beforeEach(() => {
        const containerMock: Container = new ContainerMockCreator().createMock();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(Observable.empty<MouseEvent>());

        markerComponent =
            new MarkerComponent(
                MarkerComponent.componentName,
                containerMock,
                new NavigatorMockCreator().createMock());

        markerComponent.activate();
    });

    it("It should be able to create two markers at the exact same position", () => {
        let m1: Marker = new SimpleMarker("1", { lat: 0, lon: 0 }, {});
        markerComponent.add([m1]);
        expect(markerComponent.getAll().length).toBe(1);

        let m2: Marker = new SimpleMarker("2", { lat: 0, lon: 0 }, {});
        markerComponent.add([m2]);
        expect(markerComponent.getAll().length).toBe(2);

        markerComponent.remove([m1.id]);
        expect(markerComponent.getAll().length).toBe(1);

        markerComponent.remove([m2.id]);
        expect(markerComponent.getAll().length).toBe(0);
    });

    it("It should be able to update an marker by using the same id", () => {
        let m1: Marker = new SimpleMarker("1", { lat: 0, lon: 0 }, {});
        markerComponent.add([m1]);
        expect(markerComponent.getAll().length).toBe(1);
        expect(markerComponent.get("1").latLon.lat).toBe(0);
        expect(markerComponent.get("1").latLon.lon).toBe(0);

        let m2: Marker = new SimpleMarker("1", { lat: 1, lon: 1 }, {});
        markerComponent.add([m2]);
        expect(markerComponent.getAll().length).toBe(1);
        expect(markerComponent.get("1").latLon.lat).toBe(1);
        expect(markerComponent.get("1").latLon.lon).toBe(1);
    });
});
