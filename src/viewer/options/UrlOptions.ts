/**
 * Interface for the URL options that can be provided to the viewer.
 *
 * @interface
 */
export interface UrlOptions {
    /**
     * Explore host.
     *
     * @description Host used for links to the full
     * mapillary website.
     *
     * @default {"www.mapillary.com"}
     */
    exploreHost?: string;

    /**
     * Scheme.
     *
     * @description Used for all hosts.
     *
     * @default {"https"}
     */
    scheme?: string;
}
