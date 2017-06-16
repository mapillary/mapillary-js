/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    DOMRenderer,
    IVNodeHash,
} from "../../src/Render";

export class DOMRendererMockCreator extends MockCreator {
    public createMock(): DOMRenderer {
        let mock: DOMRenderer = super.createMock(DOMRenderer, "DOMRenderer");

        this._mockProperty(mock, "render$", new Subject<IVNodeHash>());

        return mock;
    }
}

export default DOMRendererMockCreator;
