interface Window {
     webkitRequestAnimationFrame(callback: FrameRequestCallback): number;
     webkitCancelAnimationFrame: (id: number) => void;

     mozRequestAnimationFrame(callback: FrameRequestCallback): number;
     mozCancelAnimationFrame: (id: number) => void;

     oRequestAnimationFrame(callback: FrameRequestCallback): number;
     oCancelAnimationFrame: (id: number) => void;
}