import {IViewerOptions} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

export class OptionsParser {
    public parseAndDefaultOptions(options: IViewerOptions): IViewerOptions {
        if (false) {
            throw new ParameterMapillaryError();
        }
        return options;
    }
}

export default OptionsParser
