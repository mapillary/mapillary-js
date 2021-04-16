import { NavigationFallbackConfiguration }
    from "../../component/interfaces/NavigationFallbackConfiguration";

/**
 * Interface for the fallback component options that can be
 * provided to the viewer when the browser does not have
 * WebGL support.
 *
 * @interface
 */
export interface FallbackOptions {

    /**
     * Show static images without pan, zoom, or transitions.
     *
     * @description Fallback for `image` when WebGL is not supported.
     *
     * @default false
     */
    image?: boolean;

    /**
     * Show static navigation arrows in the corners.
     *
     * @description Fallback for `direction` and `sequence` when WebGL is not supported.
     *
     * @default false
     */
    navigation?: boolean | NavigationFallbackConfiguration;
}
