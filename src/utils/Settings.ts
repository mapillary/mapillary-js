import { ImageSize } from "../viewer/ImageSize";
import { ViewerOptions } from "../viewer/interfaces/ViewerOptions";

export class Settings {
    private static _baseImageSize: number;
    private static _baseSphericalSize: number;
    private static _maxImageSize: number;

    public static get baseImageSize(): number {
        return Settings._baseImageSize;
    }

    public static get baseSphericalSize(): number {
        return Settings._baseSphericalSize;
    }

    public static get maxImageSize(): number {
        return Settings._maxImageSize;
    }

    public static setOptions(options: ViewerOptions): void {
        Settings._baseImageSize = options.baseImageSize != null ?
            options.baseImageSize :
            ImageSize.Size640;

        Settings._baseSphericalSize = options.baseSphericalSize != null ?
            options.baseSphericalSize :
            ImageSize.Size2048;

        Settings._maxImageSize = options.maxImageSize != null ?
            options.maxImageSize :
            ImageSize.Size2048;
    }
}
