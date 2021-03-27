import { Subject } from "rxjs";
import { DOMRenderer } from "../../src/render/DOMRenderer";
import { VirtualNodeHash } from "../../src/render/interfaces/VirtualNodeHash";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

export class DOMRendererMockCreator extends MockCreatorBase<DOMRenderer> {
    public create(): DOMRenderer {
        const mock: DOMRenderer = new MockCreator().create(DOMRenderer, "DOMRenderer");

        this._mockProperty(mock, "element$", new Subject<VirtualNodeHash>());
        this._mockProperty(mock, "render$", new Subject<VirtualNodeHash>());

        return mock;
    }
}
