import { Subject } from "rxjs";
import { DOMRenderer } from "../../src/render/DOMRenderer";
import { IVNodeHash } from "../../src/render/interfaces/IVNodeHash";

import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";

export class DOMRendererMockCreator extends MockCreatorBase<DOMRenderer> {
    public create(): DOMRenderer {
        const mock: DOMRenderer = new MockCreator().create(DOMRenderer, "DOMRenderer");

        this._mockProperty(mock, "element$", new Subject<IVNodeHash>());
        this._mockProperty(mock, "render$", new Subject<IVNodeHash>());

        return mock;
    }
}
