import {IViewerOptions} from "../Viewer";

export class OptionsParser {
    public parseAndDefaultOptions(options: IViewerOptions): IViewerOptions {
        if (options === undefined || options == null) {
            options = {};
        }

        if (options.uis == null) {
            options.uis = ["cover"];
        }

        if (options.uiList == null) {
            options.uiList = ["none", "cover", "simple", "gl", "css"];
        }

        return options;
    }
}

export default OptionsParser
