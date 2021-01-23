import { IGLRenderFunction } from "./IGLRenderFunction";
import { GLRenderStage } from "../GLRenderStage";

export interface IGLRender {
    frameId: number;
    needsRender: boolean;
    render: IGLRenderFunction;
    stage: GLRenderStage;
}
