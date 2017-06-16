/// <reference path="../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";

import {TagComponent} from "../../../src/Component";
import {Container} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

describe("TagComponent.ctor", () => {
    it("should be defined", () => {
        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

        expect(tagComponent).toBeDefined();
    });
});

describe("TagComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const containerMock: Container = new ContainerMockCreator().createMock();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(Observable.empty<MouseEvent>());

        const tagComponent: TagComponent =
            new TagComponent(
                TagComponent.componentName,
                containerMock,
                new NavigatorMockCreator().createMock());

        tagComponent.activate();
        tagComponent.deactivate();
    });
});
