export class FrameGenerator {
    private _cancelAnimationFrame: (handle: number) => void;
    private _requestAnimationFrame: (cb: () => void) => number;

    constructor(root: any) {
        if (root.requestAnimationFrame) {
            this._cancelAnimationFrame = root.cancelAnimationFrame.bind(root);
            this._requestAnimationFrame = root.requestAnimationFrame.bind(root);
        } else if (root.mozRequestAnimationFrame) {
            this._cancelAnimationFrame = root.mozCancelAnimationFrame.bind(root);
            this._requestAnimationFrame = root.mozRequestAnimationFrame.bind(root);
        } else if (root.webkitRequestAnimationFrame) {
            this._cancelAnimationFrame = root.webkitCancelAnimationFrame.bind(root);
            this._requestAnimationFrame = root.webkitRequestAnimationFrame.bind(root);
        } else if (root.msRequestAnimationFrame) {
            this._cancelAnimationFrame = root.msCancelAnimationFrame.bind(root);
            this._requestAnimationFrame = root.msRequestAnimationFrame.bind(root);
        } else if (root.oRequestAnimationFrame) {
            this._cancelAnimationFrame = root.oCancelAnimationFrame.bind(root);
            this._requestAnimationFrame = root.oRequestAnimationFrame.bind(root);
        } else {
            this._cancelAnimationFrame = root.clearTimeout.bind(root);
            this._requestAnimationFrame = (cb: () => void): number => { return root.setTimeout(cb, 1000 / 60); };
        }
    }

     public get cancelAnimationFrame(): (handle: number) => void {
         return this._cancelAnimationFrame;
     }

     public get requestAnimationFrame(): (cb: () => void) => number {
         return this._requestAnimationFrame;
     }
}

export default FrameGenerator;
