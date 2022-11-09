export enum CameraVisualizationMode {
    /**
     * Cameras are hidden.
     */
    Hidden,

    /**
     * Cameras are shown, all with the same color.
     */
    Homogeneous,

    /**
     * Cameras are shown with colors based on the
     * their clusters.
     */
    Cluster,

    /**
     * Cameras are shown with colors based on the
     * their connected components.
     */
    ConnectedComponent,

    /**
     * Cameras are shown, with colors based on the
     * their sequence.
     */
    Sequence,
}
