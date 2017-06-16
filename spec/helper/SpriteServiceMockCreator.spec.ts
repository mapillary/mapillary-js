/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {MockCreator} from "./MockCreator.spec";
import {
    ISpriteAtlas,
    SpriteService,
} from "../../src/Viewer";

export class SpriteServiceMockCreator extends MockCreator {
    public createMock(): SpriteService {
        let mock: SpriteService = super.createMock(SpriteService, "SpriteService");

        this._mockProperty(mock, "spriteAtlas$", new Subject<ISpriteAtlas>());

        return mock;
    }
}

export default SpriteServiceMockCreator;
