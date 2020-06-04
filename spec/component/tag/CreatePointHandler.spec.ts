import {
    empty as observableEmpty,
    of as observableOf,
    Observable,
    Subject,
} from "rxjs";

import {
    Component,
    CreatePointHandler,
    Geometry,
    ITagConfiguration,
    PointGeometry,
    TagCreator,
} from "../../../src/Component";
import {ViewportCoords} from "../../../src/Geo";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

class TestComponent extends Component<ITagConfiguration> {
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }
    protected _getDefaultConfiguration(): ITagConfiguration { return {}; }
}

describe("CreatePointHandler.ctor", () => {
    it("should be defined", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createPointHandler: CreatePointHandler = new CreatePointHandler(component, container, navigator, viewportCoords, tagCreator);

        expect(createPointHandler).toBeDefined();
    });
});

describe("CreatePointHandler.disable", () => {
    it("should enable and disable", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createPointHandler: CreatePointHandler = new CreatePointHandler(component, container, navigator, viewportCoords, tagCreator);

        component.activate();
        createPointHandler.enable();
        expect(createPointHandler.isEnabled).toBe(true);

        createPointHandler.disable();
        expect(createPointHandler.isEnabled).toBe(false);
    });
});

describe("CreatePointHandler.geometryCreated$", () => {
    it("should create point geometry on valid basic static click", (done: Function) => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createPointHandler: CreatePointHandler = new CreatePointHandler(component, container, navigator, viewportCoords, tagCreator);

        const basicProximateClick$: Subject<number[]> = new Subject<number[]>();
        spyOn(container.mouseService.proximateClick$, "pipe").and.returnValue(basicProximateClick$);

        component.activate();
        createPointHandler.enable();

        const basicPoint: number[] = [0.5, 0.6];

        createPointHandler.geometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    expect(geometry instanceof PointGeometry).toBe(true);

                    const pointGeometry: PointGeometry = <PointGeometry>geometry;

                    expect(pointGeometry.point[0]).toBe(basicPoint[0]);
                    expect(pointGeometry.point[1]).toBe(basicPoint[1]);

                    done();
                });

        basicProximateClick$.next(basicPoint);
    });

    it("should not create point geometry if not enabled", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createPointHandler: CreatePointHandler = new CreatePointHandler(component, container, navigator, viewportCoords, tagCreator);

        const basicProximateClick$: Subject<number[]> = new Subject<number[]>();
        spyOn(container.mouseService.proximateClick$, "pipe").and.returnValue(basicProximateClick$);

        component.activate();

        const basicPoint: number[] = [0.5, 0.6];

        let geometryCreatedCount: number = 0;
        createPointHandler.geometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    geometryCreatedCount++;
                });

        basicProximateClick$.next(basicPoint);
        expect(geometryCreatedCount).toBe(0);
    });

    it("should create multiple geometries on multiple static clicks", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createPointHandler: CreatePointHandler = new CreatePointHandler(component, container, navigator, viewportCoords, tagCreator);

        const basicProximateClick$: Subject<number[]> = new Subject<number[]>();
        spyOn(container.mouseService.proximateClick$, "pipe").and.returnValue(basicProximateClick$);

        component.activate();
        createPointHandler.enable();

        const basicPoint: number[] = [0.5, 0.6];

        let geometryCreatedCount: number = 0;
        createPointHandler.geometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    geometryCreatedCount++;
                });

        basicProximateClick$.next(basicPoint);
        expect(geometryCreatedCount).toBe(1);

        basicProximateClick$.next(basicPoint);
        expect(geometryCreatedCount).toBe(2);

        basicProximateClick$.next(basicPoint);
        expect(geometryCreatedCount).toBe(3);
    });

    it("should not create point geometry if basic point is not valid", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createPointHandler: CreatePointHandler = new CreatePointHandler(component, container, navigator, viewportCoords, tagCreator);

        const basicProximateClick$: Subject<number[]> = new Subject<number[]>();
        spyOn(container.mouseService.proximateClick$, "pipe").and.returnValue(basicProximateClick$);

        component.activate();
        createPointHandler.enable();

        const basicPoint: number[] = [-1, 0.6];

        let geometryCreatedCount: number = 0;
        createPointHandler.geometryCreated$
            .subscribe(
                (geometry: Geometry): void => {
                    geometryCreatedCount++;
                });

        basicProximateClick$.next(basicPoint);
        expect(geometryCreatedCount).toBe(0);
    });
});
