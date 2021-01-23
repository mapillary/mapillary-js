import { Subject } from "rxjs";
import { EdgeDirection } from "../../src/graph/edge/EdgeDirection";
import { PlayService } from "../../src/viewer/PlayService";

import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";

export class PlayServiceMockCreator extends MockCreatorBase<PlayService> {
    public create(): PlayService {
        const mock: PlayService = new MockCreator().create(PlayService, "PlayService");

        this._mockProperty(mock, "direction$", new Subject<EdgeDirection>());
        this._mockProperty(mock, "playing$", new Subject<boolean>());
        this._mockProperty(mock, "speed$", new Subject<boolean>());

        return mock;
    }
}
