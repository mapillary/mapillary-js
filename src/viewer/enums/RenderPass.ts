export enum RenderPass {
    /**
     * Occurs after the background render pass.
     */
    Opaque,

    /**
     * Occurs last in the render sequence, after the opaque render pass.
     */
    Transparent,
}
