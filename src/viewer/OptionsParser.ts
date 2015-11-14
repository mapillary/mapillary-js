import {IViewerOptions} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

export class OptionsParser {
    public parseAndDefaultOptions(options: IViewerOptions): IViewerOptions {
        if (!options.key) {
            throw new ParameterMapillaryError();
        }

        if (options.ui == null) {
            options.ui = "cover";
        }
        if (options.ui !== "cover" && options.ui !== "simple" && options.ui !== "gl") {
            throw new ParameterMapillaryError();
        }

        return options;
    }
}

export default OptionsParser
