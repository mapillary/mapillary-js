import { GLRenderFunction } from "./GLRenderFunction";
import { RenderPass } from "../RenderPass";

export interface GLFrameRenderer {
    frameId: number;
    needsRender: boolean;
    render: GLRenderFunction;
    pass: RenderPass;
}
