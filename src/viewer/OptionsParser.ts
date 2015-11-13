import {IViewerOptions} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

export class OptionsParser {
    public parseAndDefaultOptions(options: IViewerOptions): IViewerOptions {
        if (options.active == null) {
            options.active = true;
        }

        if (!options.key) {
            throw new ParameterMapillaryError();
        }

        return options;
    }
}

export default OptionsParser
