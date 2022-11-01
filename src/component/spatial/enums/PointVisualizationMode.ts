export enum PointVisualizationMode {
    /**
     * Points are hidden.
     */
    Hidden,

    /**
     * Visualize points with original colors.
     */
    Original,

    /**
     * Paint all points belonging to a specific
     * cluster with the same random color.
     */
    Cluster,

    /**
     * Manually paint the points of each cluster with a
     * specific color.
     *
     * @description If no color has been specified for a
     * visualized cluster, the cluster will be shown with
     * a default color.
     */
    Manual,
}
