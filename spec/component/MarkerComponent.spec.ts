/// <reference path="../../typings/index.d.ts" />

import {
    SimpleMarker,
    Marker,
    MarkerComponent,
} from "../../src/Component";

import {ContainerMockCreator} from "../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../helper/NavigatorMockCreator.spec";

describe("MarkerComponent", () => {
    let markerComponent: MarkerComponent;

    beforeEach(() => {
        markerComponent =
            new MarkerComponent(
                MarkerComponent.componentName,
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

        markerComponent.activate();
    });

    it("It should be able to create two markers at the exact same position", () => {
        let m1: Marker = new SimpleMarker("1", { lat: 0, lon: 0}, {});
        markerComponent.add([m1]);
        markerComponent.getAll$()
            .subscribe(
                (markers: Marker[]): void => {
                    expect(markers.length).toBe(1);
                });

        let m2: Marker = new SimpleMarker("2", { lat: 0, lon: 0}, {});
        markerComponent.add([m2]);
        markerComponent.getAll$()
            .subscribe(
                (markers: Marker[]): void => {
                    expect(markers.length).toBe(2);
                });

        markerComponent.remove([m1.id]);
        markerComponent.getAll$()
            .subscribe(
                (markers: Marker[]): void => {
                    expect(markers.length).toBe(1);
                });

        markerComponent.remove([m2.id]);
        markerComponent.getAll$()
            .subscribe(
                (markers: Marker[]): void => {
                    expect(markers.length).toBe(0);
                });
    });

    it("It should be able to update an marker by using the same id", () => {
        let m1: Marker = new SimpleMarker("1", { lat: 0, lon: 0}, {});
        markerComponent.add([m1]);
        markerComponent.getAll$()
            .subscribe(
                (markers: Marker[]): void => {
                    expect(markers.length).toBe(1);
                });

        let m2: Marker = new SimpleMarker("1", { lat: 0, lon: 0}, {});
        markerComponent.add([m2]);
        markerComponent.getAll$()
            .subscribe(
                (markers: Marker[]): void => {
                    expect(markers.length).toBe(1);
                });
    });
});
