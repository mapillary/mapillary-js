interface INode {
    node: string;
}

export class Viewer {
    constructor (id: string, node: INode ) {
        return "Viewer -- id: " + id + ", node: " + node.node;
    }
}

export default Viewer;
