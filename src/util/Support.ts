export function isBrowser(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof document !== "undefined"
    );
}

export function isArraySupported(): boolean {
    return !!(
        Array.prototype &&
        Array.prototype.concat &&
        Array.prototype.filter &&
        Array.prototype.includes &&
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

export function isBlobSupported(): boolean {
    return (
        "Blob" in window &&
        "URL" in window
    );
}

export function isFunctionSupported(): boolean {
    return !!(
        Function.prototype &&
        Function.prototype.apply &&
        Function.prototype.bind
    );
}

export function isJSONSupported(): boolean {
    return (
        "JSON" in window &&
        "parse" in JSON &&
        "stringify" in JSON
    );
}

export function isMapSupported(): boolean {
    return "Map" in window;
}

export function isObjectSupported(): boolean {
    return !!(
        Object.assign &&
        Object.keys &&
        Object.values
    );
}

export function isPromiseSupported(): boolean {
    return !!(
        "Promise" in window &&
        Promise.resolve &&
        Promise.reject &&
        Promise.prototype &&
        Promise.prototype.catch &&
        Promise.prototype.then
    );
}

export function isSetSupported(): boolean {
    return "Set" in window;
}

let isWebGLSupportedCache: boolean = undefined;
export function isWebGLSupportedCached(): boolean {
    if (isWebGLSupportedCache === undefined) {
        isWebGLSupportedCache = isWebGLSupported();
    }

    return isWebGLSupportedCache;
}

export function isWebGLSupported(): boolean {
    const attributes: WebGLContextAttributes = {
        alpha: false,
        antialias: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true,
    };

    const canvas = document.createElement("canvas");
    const webGL2Context = canvas.getContext("webgl2", attributes);
    if (!!webGL2Context) { return true; }

    const context =
        canvas.getContext("webgl", attributes) ||
        <WebGLRenderingContext>canvas
            .getContext("experimental-webgl", attributes);

    if (!context) { return false; }

    const requiredExtensions = ["OES_standard_derivatives"];
    const supportedExtensions = context.getSupportedExtensions();
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
 * @example `var supported = isSupported();`
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
 * @example `var fallbackSupported = isFallbackSupported();`
 */
export function isFallbackSupported(): boolean {
    return isBrowser() &&
        isArraySupported() &&
        isBlobSupported() &&
        isFunctionSupported() &&
        isJSONSupported() &&
        isMapSupported() &&
        isObjectSupported() &&
        isPromiseSupported() &&
        isSetSupported();
}
