import Pbf from "pbf";

import { MeshEnt } from "./ents/MeshEnt";

/**
 * @class PbfMeshReader
 *
 * @classdesc Static helper class used to get read an array buffer
 * containing protobuf fields into a mesh object.
 */
export class PbfMeshReader {
    /**
     * Read the fields of a protobuf array buffer into a mesh
     * object.
     *
     * @static
     * @param {ArrayBuffer} buffer - Array buffer to read.
     *
     * @returns {MeshEnt} Mesh object.
     */
    public static read(buffer: ArrayBuffer): MeshEnt {
        const pbf = new Pbf(buffer);
        return pbf.readFields(
            PbfMeshReader._readMeshField,
            { faces: [], vertices: [] });
    }

    private static _readMeshField(tag: number, mesh: MeshEnt, pbf: Pbf): void {
        if (tag === 1) {
            mesh.vertices.push(pbf.readFloat());
        } else if (tag === 2) {
            mesh.faces.push(pbf.readVarint());
        }
    }
}
