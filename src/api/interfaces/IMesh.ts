/**
 * Interface that describes SfM triangulated meshes.
 *
 * @interface IMesh
 */
export interface IMesh {
    /**
     * Flattened array of faces for the mesh. Each face consist
     * three vertex indices.
     */
    faces: number[];

    /**
     * Flattened array of vertices for the mesh. Each vertex
     * consists of X, Y and Z coordinates in the camera frame.
     */
    vertices: number[];
}

export default IMesh;
