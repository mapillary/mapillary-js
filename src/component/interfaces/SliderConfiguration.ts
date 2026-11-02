import { ComponentConfiguration } from "./ComponentConfiguration";
/**
 * Enumeration for slider mode.
 *
 * @enum {number}
 * @readonly
 *
 * @description Modes for specifying how transitions
 * between images are performed in slider mode. Only
 * applicable when the slider component determines
 * that transitions with motion is possilble. When it
 * is not, the stationary mode will be applied.
 */
export enum SliderConfigurationMode {
    /**
     * Transitions with motion.
     *
     * @description The slider component moves the
     * camera between the image origins.
     *
     * In this mode it is not possible to zoom or pan.
     *
     * The slider component falls back to stationary
     * mode when it determines that the pair of images
     * does not have a strong enough relation.
     */
    Motion,
    /**
     * Stationary transitions.
     *
     * @description The camera is stationary.
     *
     * In this mode it is possible to zoom and pan.
     */
    Stationary,
}
/**
 * Interface for configuration of slider ids.
 *
 * @interface
 */
export interface SliderConfigurationIds {
    /**
     * Id for the image plane in the background.
     */
    background: string;
    /**
     * Id for the image plane in the foreground.
     */
    foreground: string;
}
/**
 * Interface for configuration of slider component.
 *
 * @interface
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         slider: {
 *             initialPosition: 0.5,
 *             ids: {
 *                 background: '<background-id>',
 *                 foreground: '<foreground-id>',
 *             },
 *             sliderVisible: true,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface SliderConfiguration extends ComponentConfiguration {
    /**
     * Keep stationary comparison cameras aligned to gravity.
     *
     * @default false
     */
    gravityAligned?: boolean;
    /**
     * Reproject the background into the foreground's live world view.
     *
     * @description Opt-in for calibrated common-view comparisons. Preserves
     * the original foreground camera and each image's lens projection. Use
     * Stationary mode; the caller must validate shared coverage, crop the
     * view, and prevent interaction into uncovered regions. Overrides
     * gravityAligned camera leveling for this comparison.
     *
     * @default false
     */
    viewAligned?: boolean;
    /**
     * Opt in to guarded, interactive 3D translation for viewAligned pairs.
     *
     * @description Only hydrated perspective pairs in the same nonempty merged
     * component, with genuine meshes, valid poses/scales, <=2m baseline,
     * <=10-degree sampled hit parallax and shared photo/mesh coverage can use Motion.
     * Unsafe or unavailable data always uses Stationary; mode controls cannot
     * override rejection. Explicit Stationary remains manual 2D. Coverage is a
     * conservative bounded heuristic, not a mathematical guarantee.
     * @default false
     */
    automaticMotion?: boolean;
    /**
     * Image-based refinement of the background's reconstructed orientation.
     *
     * @description World-frame rotation quaternion [x, y, z, w] that maps the
     * background's reconstructed viewing rays onto the foreground's, e.g.
     * estimated by matching both photos. Applies to viewAligned Stationary
     * rendering only and replaces the roll safeguard while set. Invalid
     * values are ignored.
     *
     * @default undefined
     */
    viewCorrection?: number[];
    /**
     * Clip the foreground at a fraction of the visible viewport width.
     *
     * @description Keeps the split independent of image projection, pan,
     * horizon leveling and zoom. Image-coordinate clipping remains the default.
     * @default false
     */
    screenSpace?: boolean;
    /**
     * Soft edge for the screenSpace curtain: half width of the blend around
     * the split, as a fraction of the viewport width (0 to 0.1). 0 keeps
     * the hard split.
     * @default 0
     */
    curtainFeather?: number;
    /**
     * Initial position of the slider on the interval [0, 1].
     *
     * @description Configures the initial position of the slider.
     * The inital position value will be used when the component
     * is activated.
     *
     * @default 1
     */
    initialPosition?: number;
    /**
     * Slider image ids.
     *
     * @description Configures the component to show the image
     * planes for the supplied image ids  in the foreground
     * and the background.
     */
    ids?: SliderConfigurationIds;
    /**
     * Value indicating whether the slider should be visible.
     *
     * @description Set the value controlling if the
     * slider is visible.
     *
     * @default true
     */
    sliderVisible?: boolean;
    /**
     * Mode used for image pair transitions.
     *
     * @description Configures the mode for transitions between
     * image pairs.
     */
    mode?: SliderConfigurationMode;
}
