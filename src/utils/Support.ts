export function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isArraySupported(): boolean {
    return !!(
        Array.prototype &&
        Array.prototype.concat &&
        Array.prototype.filter &&
        Array.prototype.indexOf &&
        Array.prototype.join &&
        Array.prototype.map &&
        Array.prototype.push &&
        Array.prototype.pop &&
        Array.prototype.reverse &&
        Array.prototype.shift &&
        Array.prototype.slice &&
        Array.prototype.splice &&
        Array.prototype.sort &&
        Array.prototype.unshift
    );
}

export function isFunctionSupported(): boolean {
    return !!(Function.prototype && Function.prototype.bind);
}

export function isJSONSupported(): boolean {
    return "JSON" in window && "parse" in JSON && "stringify" in JSON;
}

export function isObjectSupported(): boolean {
    return !!(
        Object.keys &&
        Object.assign
    );
}

export function isBlobSupported(): boolean {
    return "Blob" in window && "URL" in window;
}

let isWebGLSupportedCache: boolean = undefined;
export function isWebGLSupportedCached(): boolean {
    if (isWebGLSupportedCache === undefined) {
        isWebGLSupportedCache = isWebGLSupported();
    }

    return isWebGLSupportedCache;
}

export function isWebGLSupported(): boolean {
    const webGLContextAttributes: WebGLContextAttributes = {
        alpha: false,
        antialias: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true,
    };

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const context: WebGLRenderingContext =
        canvas.getContext("webgl", webGLContextAttributes) ||
        <WebGLRenderingContext>canvas.getContext("experimental-webgl", webGLContextAttributes);

    if (!context) {
        return false;
    }

    const requiredExtensions: string[] = [
        "OES_standard_derivatives",
    ];

    const supportedExtensions: string[] = context.getSupportedExtensions();
    for (const requiredExtension of requiredExtensions) {
        if (supportedExtensions.indexOf(requiredExtension) === -1) {
            return false;
        }
    }

    return true;
}

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
        isWebGLSupportedCached();
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
    return isBrowser() &&
        isBlobSupported() &&
        isArraySupported() &&
        isFunctionSupported() &&
        isJSONSupported() &&
        isObjectSupported();
}
