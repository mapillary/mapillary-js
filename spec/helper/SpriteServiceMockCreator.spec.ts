import { Subject } from "rxjs";
import { ISpriteAtlas } from "../../src/viewer/interfaces/ISpriteAtlas";
import { SpriteService } from "../../src/viewer/SpriteService";

import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";

export class SpriteServiceMockCreator extends MockCreatorBase<SpriteService> {
    public create(): SpriteService {
        const mock: SpriteService = new MockCreator().create(SpriteService, "SpriteService");

        this._mockProperty(mock, "spriteAtlas$", new Subject<ISpriteAtlas>());

        return mock;
    }
}
