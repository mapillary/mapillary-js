/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    MouseService,
} from "../../src/Viewer";

export class MouseServiceMockCreator extends MockCreatorBase<MouseService> {
    public create(): MouseService {
        const mock: MouseService = new MockCreator().create(MouseService, "MouseService");

        this._mockProperty(mock, "activate$", new Subject<boolean>());
        this._mockProperty(mock, "active$", new Subject<boolean>());
        this._mockProperty(mock, "click$", new Subject<MouseEvent>());
        this._mockProperty(mock, "contextMenu$", new Subject<MouseEvent>());
        this._mockProperty(mock, "dblClick$", new Subject<MouseEvent>());
        this._mockProperty(mock, "domMouseDragStart$", new Subject<MouseEvent>());
        this._mockProperty(mock, "domMouseDrag$", new Subject<MouseEvent>());
        this._mockProperty(mock, "domMouseDragEnd$", new Subject<MouseEvent>());
        this._mockProperty(mock, "domMouseMove$", new Subject<MouseEvent>());
        this._mockProperty(mock, "documentMouseMove$", new Subject<MouseEvent>());
        this._mockProperty(mock, "documentMouseUp$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseDown$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseDrag$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseDragEnd$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseDragStart$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseMove$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseOut$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseOver$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseUp$", new Subject<MouseEvent>());
        this._mockProperty(mock, "mouseWheel$", new Subject<MouseEvent>());
        this._mockProperty(mock, "proximateClick$", new Subject<MouseEvent>());
        this._mockProperty(mock, "staticClick$", new Subject<MouseEvent>());

        return mock;
    }
}

export default MouseServiceMockCreator;
