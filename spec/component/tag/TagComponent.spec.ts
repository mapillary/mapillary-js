
import {empty as observableEmpty, Observable, Subject} from "rxjs";

import {
    PointGeometry,
    SpotTag,
    Tag,
    TagComponent,
} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";
import {TransformHelper} from "../../helper/TransformHelper.spec";

describe("TagComponent.ctor", () => {
    it("should be defined", () => {
        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(tagComponent).toBeDefined();
    });
});

describe("TagComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                new NavigatorMockCreator().create());

        tagComponent.activate();
        tagComponent.deactivate();
    });
});

describe("TagComponent.add", () => {
    it("should add a single tag when deactivated", () => {
        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag: SpotTag = new SpotTag("id", geometry, {});

        tagComponent.add([tag]);

        const result: Tag = tagComponent.get(tag.id);

        expect(result).toBeDefined();
        expect(result.id).toBe(tag.id);
    });

    it("should add multiple tags when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        const result1: Tag = tagComponent.get(tag1.id);

        expect(result1).toBeDefined();
        expect(result1.id).toBe(tag1.id);

        const result2: Tag = tagComponent.get(tag2.id);

        expect(result2).toBeDefined();
        expect(result2.id).toBe(tag2.id);
    });

    it("should add a single tag when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag: SpotTag = new SpotTag("id", geometry, {});

        tagComponent.add([tag]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result: Tag = tagComponent.get(tag.id);

        expect(result).toBeDefined();
        expect(result.id).toBe(tag.id);
    });

    it("should add multiple tags when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result1: Tag = tagComponent.get(tag1.id);

        expect(result1).toBeDefined();
        expect(result1.id).toBe(tag1.id);

        const result2: Tag = tagComponent.get(tag2.id);

        expect(result2).toBeDefined();
        expect(result2.id).toBe(tag2.id);
    });
});

describe("TagComponent.getAll", () => {
    it("should get a single tag when deactivated", () => {
        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag: SpotTag = new SpotTag("id", geometry, {});

        tagComponent.add([tag]);

        const result: Tag[] = tagComponent.getAll();

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(tag.id);
    });

    it("should get multiple tags when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        const result: Tag[] = tagComponent.getAll();

        expect(result.length).toBe(2);

        const ids: string[] = result.map((tag: Tag): string => { return tag.id; });
        expect(ids.indexOf(tag1.id)).not.toBe(-1);
        expect(ids.indexOf(tag2.id)).not.toBe(-1);
    });

    it("should get a single tag when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag: SpotTag = new SpotTag("id", geometry, {});

        tagComponent.add([tag]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result: Tag[] = tagComponent.getAll();

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(tag.id);
    });

    it("should add multiple tags when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result: Tag[] = tagComponent.getAll();

        expect(result.length).toBe(2);

        const ids: string[] = result.map((tag: Tag): string => { return tag.id; });
        expect(ids.indexOf(tag1.id)).not.toBe(-1);
        expect(ids.indexOf(tag2.id)).not.toBe(-1);
    });
});

describe("TagComponent.remove", () => {
    it("should remove a single tag when deactivated", () => {
        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag: SpotTag = new SpotTag("id", geometry, {});

        tagComponent.add([tag]);
        tagComponent.remove([tag.id]);

        const result: Tag = tagComponent.get(tag.id);

        expect(result).toBeUndefined();
    });

    it("should remove multiple tags when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);
        tagComponent.remove([tag1.id, tag2.id]);

        const result1: Tag = tagComponent.get(tag1.id);
        expect(result1).toBeUndefined();

        const result2: Tag = tagComponent.get(tag2.id);
        expect(result2).toBeUndefined();
    });

    it("should remove one of multiple tags when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);
        tagComponent.remove([tag1.id]);

        const result1: Tag = tagComponent.get(tag1.id);
        expect(result1).toBeUndefined();

        const result2: Tag = tagComponent.get(tag2.id);
        expect(result2).toBeDefined();
    });

    it("should remove a single tag when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag: SpotTag = new SpotTag("id", geometry, {});

        tagComponent.add([tag]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result1: Tag = tagComponent.get(tag.id);
        expect(result1).toBeDefined();

        tagComponent.remove([tag.id]);

        const result2: Tag = tagComponent.get(tag.id);
        expect(result2).toBeUndefined();
    });

    it("should remove multiple tags when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result1: Tag = tagComponent.get(tag1.id);
        expect(result1).toBeDefined();

        const result2: Tag = tagComponent.get(tag2.id);
        expect(result2).toBeDefined();

        tagComponent.remove([tag1.id, tag2.id]);

        const result3: Tag = tagComponent.get(tag1.id);
        expect(result3).toBeUndefined();

        const result4: Tag = tagComponent.get(tag2.id);
        expect(result4).toBeUndefined();
    });

    it("should remove one of multiple tags when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result1: Tag = tagComponent.get(tag1.id);
        expect(result1).toBeDefined();

        const result2: Tag = tagComponent.get(tag2.id);
        expect(result2).toBeDefined();

        tagComponent.remove([tag1.id]);

        const result3: Tag = tagComponent.get(tag1.id);
        expect(result3).toBeUndefined();

        const result4: Tag = tagComponent.get(tag2.id);
        expect(result4).toBeDefined();
    });
});

describe("TagComponent.removeAll", () => {
    it("should remove multiple tags when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);
        tagComponent.removeAll();

        const result1: Tag = tagComponent.get(tag1.id);
        expect(result1).toBeUndefined();

        const result2: Tag = tagComponent.get(tag2.id);
        expect(result2).toBeUndefined();
    });

    it("should remove multiple tags when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                navigatorMock);

        tagComponent.activate();

        const geometry1: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag1: SpotTag = new SpotTag("id1", geometry1, {});

        const geometry2: PointGeometry = new PointGeometry([0.5, 0.5]);
        const tag2: SpotTag = new SpotTag("id2", geometry2, {});

        tagComponent.add([tag1, tag2]);

        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(new TransformHelper().createTransform());

        const result1: Tag = tagComponent.get(tag1.id);
        expect(result1).toBeDefined();

        const result2: Tag = tagComponent.get(tag2.id);
        expect(result2).toBeDefined();

        tagComponent.removeAll();

        const result3: Tag = tagComponent.get(tag1.id);
        expect(result3).toBeUndefined();

        const result4: Tag = tagComponent.get(tag2.id);
        expect(result4).toBeUndefined();
    });
});
