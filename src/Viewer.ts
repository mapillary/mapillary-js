interface INode {
    node: string;
}

export class Viewer {
    constructor (id: string, node: INode ) {
        console.info("Viewer", "--", "id: " + id + ",", "node: " + node.node);
    }
}
