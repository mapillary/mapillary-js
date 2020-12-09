import * as Pbf from "pbf";

import IMesh from "./interfaces/IMesh";

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
     * @returns {IMesh} Mesh object.
     */
    public static read(buffer: ArrayBuffer): IMesh {
        let pbf: Pbf<IMesh> = new Pbf<IMesh>(buffer);

        return pbf.readFields(PbfMeshReader._readMeshField, { faces: [], vertices: [] });
    }

    private static _readMeshField(tag: number, mesh: IMesh, pbf: Pbf<IMesh>): void {
        if (tag === 1) {
            mesh.vertices.push(pbf.readFloat());
        } else if (tag === 2) {
            mesh.faces.push(pbf.readVarint());
        }
    }
}

export default PbfMeshReader;
