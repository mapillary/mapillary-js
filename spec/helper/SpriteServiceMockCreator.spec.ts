/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";
import {
    ISpriteAtlas,
    SpriteService,
} from "../../src/Viewer";

export class SpriteServiceMockCreator extends MockCreatorBase<SpriteService> {
    public create(): SpriteService {
        const mock: SpriteService = new MockCreator().create(SpriteService, "SpriteService");

        this._mockProperty(mock, "spriteAtlas$", new Subject<ISpriteAtlas>());

        return mock;
    }
}

export default SpriteServiceMockCreator;
