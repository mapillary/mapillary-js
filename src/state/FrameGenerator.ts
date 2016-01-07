/// <reference path="../../typings/lib/lib.d.ts" />

export class FrameGenerator {
    private _requestAnimationFrame: (callback: FrameRequestCallback) => number;
    private _cancelAnimationFrame: (id: number) => void;

    constructor() {
        if (window.requestAnimationFrame) {
            this._requestAnimationFrame = window.requestAnimationFrame;
            this._cancelAnimationFrame = window.cancelAnimationFrame;
        } else if (window.mozRequestAnimationFrame) {
            this._requestAnimationFrame = window.mozRequestAnimationFrame;
            this._cancelAnimationFrame = window.mozCancelAnimationFrame;
        } else if (window.webkitRequestAnimationFrame) {
            this._requestAnimationFrame = window.webkitRequestAnimationFrame;
            this._cancelAnimationFrame = window.webkitCancelAnimationFrame;
        } else if (window.msRequestAnimationFrame) {
            this._requestAnimationFrame = window.msRequestAnimationFrame;
            this._cancelAnimationFrame = window.msCancelRequestAnimationFrame;
        } else if (window.oRequestAnimationFrame) {
            this._requestAnimationFrame = window.oRequestAnimationFrame;
            this._cancelAnimationFrame = window.oCancelAnimationFrame;
        } else {
            this._requestAnimationFrame = (callback: FrameRequestCallback): number => {
                return window.setTimeout(callback, 1000 / 60);
            };
            this._cancelAnimationFrame = window.clearTimeout;
        }
    }

    public requestAnimationFrame(callback: FrameRequestCallback): number {
        return this._requestAnimationFrame.call(window, callback);
    }

    public cancelAnimationFrame(id: number): void {
        this._cancelAnimationFrame.call(window, id);
    }
}
