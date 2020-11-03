/**
 * Interface that describes an object with image thumb URLs.
 *
 * @interface IThumb
 */
export interface IThumb {
  thumb320?: string;
  thumb640?: string;
  thumb1024?: string;
  thumb2048?: string;
}

export default IThumb;
