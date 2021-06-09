import { Subject } from "rxjs";

import { MockCreator } from "./MockCreator";
import { MockCreatorBase } from "./MockCreatorBase";

import { ConfigurationService } from "../../src/viewer/ConfigurationService";

export class ConfigurationServiceMockCreator extends
    MockCreatorBase<ConfigurationService> {
    public create(): ConfigurationService {
        const mock: ConfigurationService =
            new MockCreator()
                .create(ConfigurationService, "ConfigurationService");

        this._mockProperty(
            mock,
            "exploreUrl$",
            new Subject<string>());
        this._mockProperty(
            mock,
            "imageTiling$",
            new Subject<boolean>());

        return mock;
    }
}
