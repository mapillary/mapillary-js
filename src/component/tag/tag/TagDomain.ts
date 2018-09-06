/**
 * Enumeration for tag domains.
 * @enum {number}
 * @readonly
 * @description Defines where lines between two vertices are treated
 * as straight.
 *
 * Only applicable for polygons. For rectangles lines between
 * vertices are always treated as straight in the distorted 2D
 * projection and bended in the undistorted 3D space.
 */
export enum TagDomain {
    /**
     * Treats lines between two vertices as straight in the
     * distorted 2D projection, i.e. on the image. If the image
     * is distorted this will result in bended lines when rendered
     * in the undistorted 3D space.
     */
    TwoDimensional,

    /**
     * Treats lines as straight in the undistorted 3D space. If the
     * image is distorted this will result in bended lines when rendered
     * on the distorted 2D projection of the image.
     */
    ThreeDimensional,
}

export default TagDomain;
