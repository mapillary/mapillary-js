import * as Pbf from "pbf";

import {IMesh} from "../Graph";

export class MeshReader {
    public static read(buffer: Buffer): IMesh {
        let pbf: Pbf<IMesh> = new Pbf<IMesh>(buffer);

        return pbf.readFields(MeshReader._readMeshField, { faces: [], vertices: [] });
    }

    private static _readMeshField(tag: number, mesh: IMesh, pbf: Pbf<IMesh>): void {
        if (tag === 1) {
            mesh.vertices.push(pbf.readFloat());
        } else if (tag === 2) {
            mesh.faces.push(pbf.readVarint());
        }
    }
}
