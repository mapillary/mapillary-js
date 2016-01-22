import {IViewerOptions} from "../Viewer";

export class Settings {
    private static _baseImageSize: number;

    public static setOptions(options: IViewerOptions): void {
        if (options.baseImageSize) {
            Settings._baseImageSize = options.baseImageSize;
        } else {
            Settings._baseImageSize = 640;
        }
    }

    public static get baseImageSize(): number {
        return Settings._baseImageSize;
    }
}

export default Settings;
