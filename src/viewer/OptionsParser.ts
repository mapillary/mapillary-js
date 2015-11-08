/* Errors */
import ParameterMapillaryError from "../errors/ParameterMapillaryError";

/* Interfaces */
import IViewerOptions from "./interfaces/IViewerOptions";

export class OptionsParser {
    public parseAndDefaultOptions(options: IViewerOptions): IViewerOptions {
        if (false) {
            throw new ParameterMapillaryError();
        }
        return options;
    }
}

export default OptionsParser
