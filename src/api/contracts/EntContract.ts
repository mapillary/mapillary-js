/**
 * Contract describing ent results.
 */
export interface EntContract<T> {
    /**
     * Ent node.
     */
    node: T;

    /**
     * Ent node id.
     */
    node_id: string;
}
