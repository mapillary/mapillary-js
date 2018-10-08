import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    DOMRenderer,
    IVNodeHash,
} from "../../src/Render";

export class DOMRendererMockCreator extends MockCreatorBase<DOMRenderer> {
    public create(): DOMRenderer {
        const mock: DOMRenderer = new MockCreator().create(DOMRenderer, "DOMRenderer");

        this._mockProperty(mock, "element$", new Subject<IVNodeHash>());
        this._mockProperty(mock, "render$", new Subject<IVNodeHash>());

        return mock;
    }
}

export default DOMRendererMockCreator;
