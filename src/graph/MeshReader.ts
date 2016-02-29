/// <reference path="../../typings/pbf/pbf.d.ts" />

import {IMesh} from "../Graph";

import * as pbf from "pbf";

export class MeshReader {
    public static read(buffer: Buffer): IMesh {
        let pbfMesh: any = new pbf(buffer);
        return MeshReader.readMesh(pbfMesh);
    }

    private static readMesh(pbf: any): IMesh {
        let flatMesh: any = pbf.readFields(MeshReader.readMeshField, {"vertices": [], "triangles": []});
        return MeshReader.flatMeshToMesh(flatMesh);
    }

    private static readMeshField(tag: any, mesh: any, pbf: any): any {
        if (tag === 1) {
            mesh.vertices.push(pbf.readFloat());
        } else if (tag === 2) {
            mesh.triangles.push(pbf.readVarint());
        }
    }

    private static flatMeshToMesh(flatMesh: any): IMesh {
        let mesh: IMesh = { faces: [], populated: false, vertices: [] };
        let numVertices: number = flatMesh.vertices.length / 3;
        for (let i: number = 0; i < numVertices; ++i) {
            mesh.vertices.push([
                flatMesh.vertices[3 * i + 0],
                flatMesh.vertices[3 * i + 1],
                flatMesh.vertices[3 * i + 2],
            ]);
        }
        let numFaces: number = flatMesh.triangles.length / 3;
        for (let i: number = 0; i < numFaces; ++i) {
            mesh.faces.push([
                flatMesh.triangles[3 * i + 0],
                flatMesh.triangles[3 * i + 1],
                flatMesh.triangles[3 * i + 2],
            ]);
        }
        return mesh;
    }
}
