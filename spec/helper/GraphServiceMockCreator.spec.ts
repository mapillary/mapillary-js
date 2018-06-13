import {Subject} from "rxjs";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";

import {EdgeDirection} from "../../src/Edge";
import {
    GraphMode,
    GraphService,
} from "../../src/Graph";

export class GraphServiceMockCreator extends MockCreatorBase<GraphService> {
    public create(): GraphService {
        const mock: GraphService = new MockCreator().create(GraphService, "GraphService");

        this._mockProperty(mock, "graphMode$", new Subject<GraphMode>());

        return mock;
    }
}

export default GraphServiceMockCreator;
