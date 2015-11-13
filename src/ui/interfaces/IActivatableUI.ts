import {Node} from "../../Graph";

export interface IActivatableUI {
    graphSupport: boolean;

    activate: () => void;
    deactivate: () => void;
    display: (node: Node) => void;
}

export default IActivatableUI;
