interface INode {
    node: string;
}

/**
 * This function initializes the viewer
 * @param { string } id of the viewer
 * @param { Node } initialNode which the viewer displays
 * @returns { Viewer } a new viewer
 */

export class Viewer {
    constructor (id: string, node: INode ) {
        return "Viewer -- id: " + id + ", node: " + node.node;
    }
}

export default Viewer;
