import {IViewerOptions} from "../Viewer";
import {ImageSize} from "../Viewer";

export class Settings {
    private static _baseImageSize: number;
    private static _basePanoramaSize: number;
    private static _maxImageSize: number;
    private static _coverImageSize: number;

    public static setOptions(options: IViewerOptions): void {
        Settings._baseImageSize = options.baseImageSize != null ?
            options.baseImageSize :
            ImageSize.Size640;

        Settings._basePanoramaSize = options.basePanoramaSize != null ?
            options.basePanoramaSize :
            ImageSize.Size2048;

        Settings._maxImageSize = options.maxImageSize != null ?
            options.maxImageSize :
            ImageSize.Size2048;

        Settings._coverImageSize = options.coverImageSize != null ?
            options.coverImageSize :
            ImageSize.Size320;
    }

    public static get baseImageSize(): number {
        return Settings._baseImageSize;
    }

    public static get basePanoramaSize(): number {
        return Settings._basePanoramaSize;
    }

    public static get maxImageSize(): number {
        return Settings._maxImageSize;
    }

    public static get coverImageSize(): number {
        return Settings._coverImageSize;
    }
}

export default Settings;
