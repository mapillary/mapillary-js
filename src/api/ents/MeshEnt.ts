/**
 * Interface that describes SfM triangulated meshes.
 *
 * @interface MeshEnt
 */
export interface MeshEnt {
    /**
     * Flattened array of faces for the mesh. Each face consist
     * three vertex indices.
     */
    faces: number[];

    /**
     * Flattened array of vertices for the mesh. Each vertex
     * consists of X, Y and Z coordinates in the camera
     * reference frame.
     */
    vertices: number[];
}
