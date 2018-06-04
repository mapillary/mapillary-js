import * as support from "./utils/Support";

/**
 * Test whether the current browser supports the full
 * functionality of MapillaryJS.
 *
 * @description The full functionality includes WebGL rendering.
 *
 * @return {boolean}
 *
 * @example `var supported = Mapillary.isSupported();`
 */
export function isSupported(): boolean {
    return isFallbackSupported() &&
        support.isWebGLSupportedCached();
}

/**
 * Test whether the current browser supports the fallback
 * functionality of MapillaryJS.
 *
 * @description The fallback functionality does not include WebGL
 * rendering, only 2D canvas rendering.
 *
 * @return {boolean}
 *
 * @example `var fallbackSupported = Mapillary.isFallbackSupported();`
 */
export function isFallbackSupported(): boolean {
    return support.isBrowser() &&
        support.isBlobSupported() &&
        support.isArraySupported() &&
        support.isFunctionSupported() &&
        support.isJSONSupported() &&
        support.isObjectSupported();
}
