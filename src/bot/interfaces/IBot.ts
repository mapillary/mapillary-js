import {Navigator} from "../../Viewer";

export interface IBot {
    activate: (navigator: Navigator) => void;
    deactivate: () => void;
}

export default IBot;
