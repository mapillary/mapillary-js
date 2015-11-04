interface INode {
    node: string;
}

export default class Viewer {
    constructor (id: string, node: INode ) {
        console.info("Viewer", "--", "id: " + id + ",", "node: " + node.node);
    }
}
