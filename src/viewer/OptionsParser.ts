import {IViewerOptions} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

export class OptionsParser {
    public parseAndDefaultOptions(options: IViewerOptions): IViewerOptions {
        if (options === undefined || options == null) {
            options = {};
        }

        if (options.ui == null) {
            options.ui = "cover";
        }

        if (options.uiList == null) {
            options.uiList = ["none", "cover", "simple", "gl"];
        }


        if (options.ui !== "none" && options.ui !== "cover" && options.ui !== "simple" && options.ui !== "gl") {
            throw new ParameterMapillaryError();
        }

        return options;
    }
}

export default OptionsParser
