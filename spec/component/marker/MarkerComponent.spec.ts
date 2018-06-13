import {empty as observableEmpty} from "rxjs";

import {
    SimpleMarker,
    Marker,
    MarkerComponent,
} from "../../../src/Component";
import {Container} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

describe("MarkerComponent.ctor", () => {
    it("should be defined", () => {
        const markerComponent: MarkerComponent =
            new MarkerComponent(
                MarkerComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(markerComponent).toBeDefined();
    });
});

describe("MarkerComponent.add", () => {
    let markerComponent: MarkerComponent;

    beforeEach(() => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        markerComponent =
            new MarkerComponent(
                MarkerComponent.componentName,
                containerMock,
                new NavigatorMockCreator().create());

        markerComponent.activate();
    });

    it("should be able to create two markers at the exact same position", () => {
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

    it("should be able to update an marker by using the same id", () => {
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

describe("MarkerComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const markerComponent: MarkerComponent =
            new MarkerComponent(
                MarkerComponent.componentName,
                containerMock,
                new NavigatorMockCreator().create());

        markerComponent.activate();
        markerComponent.deactivate();
    });
});
