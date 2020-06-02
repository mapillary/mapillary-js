export function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isArraySupported(): boolean {
    return !!(
        Array.prototype &&
        Array.prototype.filter &&
        Array.prototype.indexOf &&
        Array.prototype.map &&
        Array.prototype.reverse
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
