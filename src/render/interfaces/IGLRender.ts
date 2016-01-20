import {GLRenderStage, IGLRenderFunction} from "../../Render";

export interface IGLRender {
    frameId: number;
    needsRender: boolean;
    render: IGLRenderFunction;
    stage: GLRenderStage;
}

export default IGLRender;
