import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    TouchService,
} from "../../src/Viewer";

export class TouchServiceMockCreator extends MockCreatorBase<TouchService> {
    public create(): TouchService {
        const mock: TouchService = new MockCreator().create(TouchService, "TouchService");

        this._mockProperty(mock, "activate$", new Subject<boolean>());
        this._mockProperty(mock, "active$", new Subject<boolean>());
        this._mockProperty(mock, "doubleTap$", new Subject<TouchEvent>());
        this._mockProperty(mock, "pinch$", new Subject<TouchEvent>());
        this._mockProperty(mock, "pinchStart$", new Subject<TouchEvent>());
        this._mockProperty(mock, "pinchEnd$", new Subject<TouchEvent>());
        this._mockProperty(mock, "singleTouchDragStart$", new Subject<TouchEvent>());
        this._mockProperty(mock, "singleTouchDrag$", new Subject<TouchEvent>());
        this._mockProperty(mock, "singleTouchDragEnd$", new Subject<TouchEvent>());
        this._mockProperty(mock, "touchEnd$", new Subject<TouchEvent>());
        this._mockProperty(mock, "touchMove$", new Subject<TouchEvent>());
        this._mockProperty(mock, "touchStart$", new Subject<TouchEvent>());

        return mock;
    }
}

export default TouchServiceMockCreator;
