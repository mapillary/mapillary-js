import { GLRenderFunction } from "./GLRenderFunction";
import { GLRenderStage } from "../GLRenderStage";

export interface GLFrameRenderer {
    frameId: number;
    needsRender: boolean;
    render: GLRenderFunction;
    stage: GLRenderStage;
}
