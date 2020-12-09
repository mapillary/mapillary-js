/**
 * Interface that describes an object with image thumb URLs.
 *
 * @interface INodeUrls
 */
export interface INodeUrls {
  /**
   * URL for cluster reconstruction resource.
   */
  cluster_url?: string;

  /**
   * URL for 3D mesh resource.
   */
  mesh_url?: string;

  /**
   * URL for 320 pixel thumbnail resource.
   */
  thumb320_url?: string;

  /**
   * URL for 640 pixel thumbnail resource.
   */
  thumb640_url?: string;

  /**
   * URL for 1024 pixel thumbnail resource.
   */
  thumb1024_url?: string;

  /**
   * URL for 2048 pixel thumbnail resource.
   */
  thumb2048_url?: string;
}

export default INodeUrls;
