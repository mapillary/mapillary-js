import { Subject } from "rxjs";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";
import { PlayService } from "../../src/viewer/PlayService";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

export class PlayServiceMockCreator extends MockCreatorBase<PlayService> {
    public create(): PlayService {
        const mock: PlayService = new MockCreator().create(PlayService, "PlayService");

        this._mockProperty(mock, "direction$", new Subject<NavigationDirection>());
        this._mockProperty(mock, "playing$", new Subject<boolean>());
        this._mockProperty(mock, "speed$", new Subject<boolean>());

        return mock;
    }
}
