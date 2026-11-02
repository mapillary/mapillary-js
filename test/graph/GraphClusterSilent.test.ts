import { bootstrap } from "../Bootstrap";
bootstrap();

import { APIWrapper } from "../../src/api/APIWrapper";
import { Graph } from "../../src/graph/Graph";
import { DataProvider } from "../helper/ProviderHelper";

describe("Graph cluster membership", () => {
    it("silently skips images without a reconstruction cluster", () => {
        const graph = new Graph(new APIWrapper(new DataProvider())) as any;
        const warn = spyOn(console, "warn");

        graph._addClusterNode({ id: "unclustered", clusterId: undefined, isComplete: true });
        graph._removeClusterNode({ id: "unclustered", clusterId: undefined, isComplete: true });

        expect(warn).not.toHaveBeenCalled();
        expect(graph._clusterNodes.size).toBe(0);
    });

    it("still tracks clustered images", () => {
        const graph = new Graph(new APIWrapper(new DataProvider())) as any;
        graph._addClusterNode({ id: "a", clusterId: "c", isComplete: true });
        expect(graph._clusterNodes.get("c").has("a")).toBe(true);
        graph._removeClusterNode({ id: "a", clusterId: "c", isComplete: true });
        expect(graph._clusterNodes.has("c")).toBe(false);
    });
});
