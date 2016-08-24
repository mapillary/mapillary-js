declare module graphlib {
    interface Options {
        compound?: boolean;
        directed?: boolean;
        multigraph?: boolean;
    }

    interface Edge {
        v: string;
        w: string;
        name?: string;
    }

    class Graph<TNodeLabel, TEdgeLabel> {
        constructor(options: Options);

        setNode(v: string, label?: TNodeLabel): void;
        hasNode(v: string): boolean;
        node(v: string): TNodeLabel;

        setEdge(v: string, w: string, label?: TEdgeLabel, name?: string): void;
        outEdges(v: string, w?: string): Edge[];
        edge(edge: Edge): TEdgeLabel;
        removeEdge(edge: Edge): void;
    }
}

export = graphlib;
