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

    /**
     * Manually paint the camera frustums of each cluster
     * with a specific color.
     *
     * @description If no color has been specified for a
     * visualized cluster, the cluster will be shown with
     * a default color.
     */
    Manual,
}
