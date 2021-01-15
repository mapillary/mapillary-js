import { Subject } from "rxjs";

import { MockCreator } from "./MockCreator.spec";
import { MockCreatorBase } from "./MockCreatorBase.spec";

import GraphService from "../../src/graph/GraphService";
import GraphMode from "../../src/graph/GraphMode";
import { FilterFunction } from "../../src/graph/FilterCreator";

export class GraphServiceMockCreator extends MockCreatorBase<GraphService> {
    public create(): GraphService {
        const mock: GraphService = new MockCreator().create(GraphService, "GraphService");

        this._mockProperty(mock, "graphMode$", new Subject<GraphMode>());
        this._mockProperty(mock, "filter$", new Subject<FilterFunction>());

        return mock;
    }
}

export default GraphServiceMockCreator;
