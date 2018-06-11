import {Node} from "../../src/Graph";

import {MockCreator} from "./MockCreator.spec";
import {MockCreatorBase} from "./MockCreatorBase.spec";

export class NodeMockCreator extends MockCreatorBase<Node> {
    public create(configuration?: { [key: string]: any }): Node {
        const mock: Node = new MockCreator().create(Node, "Node");

        this._mockProperty(mock, "image", !!configuration.image ? configuration.image : new Image());
        this._mockProperty(mock, "key", !!configuration.key ? configuration.key : "key");

        return mock;
    }
}

export default NodeMockCreator;
