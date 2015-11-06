declare module "graphlib" {
    export = graphlib;

    module graphlib {
        export class Graph {
            constructor();
            hasNode(key: string): any;
            node(key: string): any;
            setNode(key: string, node: any): any;
        }
    }
}
