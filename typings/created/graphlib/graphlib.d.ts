declare module "graphlib" {
    export = graphlib;

    module graphlib {
        export class Graph {
            constructor();
            constructor(params: any);
            hasNode(key: string): any;
            node(key: string): any;
            setNode(key: string, node: any): any;
        }
    }
}
