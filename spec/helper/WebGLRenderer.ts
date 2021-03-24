export class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public clear(): void { /* noop */; }
    public clearDepth(): void { /* noop */ }
    public getContext(): void { /* noop */ }
    public getRenderTarget(): THREE.RenderTarget { return; }
    public render(
        s: THREE.Scene,
        c: THREE.Camera,
        t?: THREE.WebGLRenderTarget)
        : void { /* noop */ }
    public resetState(): void { /* noop */ }
    public setClearColor(
        color: THREE.Color | string | number,
        alpha?: number): void { /* noop */ }
    public setPixelRatio(ratio: number): void { /* noop */ }
    public setRenderTarget(): void { /* noop */ }
    public setSize(
        w: number,
        h: number,
        updateStyle?: boolean): void { /* noop */ }
}
