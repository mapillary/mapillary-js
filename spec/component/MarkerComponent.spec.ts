/// <reference path="../../typings/index.d.ts" />

import * as rbush from "rbush";

import {IMarkerOptions, ISpatialMarker, Marker, MarkerComponent} from "../../src/Component";
import {Container, Navigator} from "../../src/Viewer";

type MarkerIndex = rbush.RBush<ISpatialMarker>;

describe("MarkerComponent", () => {
    let markerComponent: MarkerComponent;

    beforeEach(() => {
        document.body.innerHTML = "<div id='dummy'></div>";
        let navigator: Navigator = new Navigator("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");
        let container: Container = new Container("dummy", navigator.stateService, {});
        markerComponent = new MarkerComponent("marker", container, navigator);
        markerComponent.activate();
    });

    it("It should be able to create two markers at the exact same position", () => {
        let markers: MarkerIndex = null;

        markerComponent.markers$.subscribe((ms: MarkerIndex) => {
            markers = ms;
        });

        let options: IMarkerOptions = {
            id: "test1",
            style: {
                color: "#F00",
            },
            type: "marker",
        };

        let m1: Marker = markerComponent.createMarker({ alt: 0, lat: 0, lon: 0 }, options);
        markerComponent.addMarker(m1);
        expect(markers.all().length).toBe(1);

        options = {
            id: "test2",
            style: {
                color: "#F00",
            },
            type: "marker",
        };

        let m2: Marker = markerComponent.createMarker({ alt: 0, lat: 0, lon: 0 }, options);
        markerComponent.addMarker(m2);
        expect(markers.all().length).toBe(2);

        markerComponent.removeMarker(m1.id);
        expect(markers.all().length).toBe(1);

        markerComponent.removeMarker(m2.id);
        expect(markers.all().length).toBe(0);
    });

    it("It should be able to update an marker by using the same id", () => {
        let markers: MarkerIndex = null;

        markerComponent.markers$.subscribe((ms: MarkerIndex) => {
            markers = ms;
        });

        let options: IMarkerOptions = {
            id: "test",
            style: {
                color: "#F00",
            },
            type: "marker",
        };

        let m1: Marker = markerComponent.createMarker({ alt: 0, lat: 0, lon: 0 }, options);
        markerComponent.addMarker(m1);
        expect(markers.all().length).toBe(1);

        let m2: Marker = markerComponent.createMarker({ alt: 1, lat: 1, lon: 1 }, options);
        markerComponent.addMarker(m2);
        expect(markers.all().length).toBe(1);
    });
});
