export enum OriginalPositionMode {
  /**
   * Original positions are hidden.
   */
  Hidden,

  /**
   * Visualize original positions with altitude change.
   */
  Altitude,

  /**
   * Visualize original positions without altitude change,
   * i.e. as flat lines from the camera origin.
   */
  Flat,
}

export default OriginalPositionMode;
