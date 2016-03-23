/// <reference path="../../typings/browser.d.ts" />

import {IMesh} from "../Graph";

import * as Pbf from "pbf";

interface IFlatMesh {
    triangles: number[];
    vertices: number[];
}

export class MeshReader {
    public static read(buffer: Buffer): IMesh {
        let pbf: Pbf<IFlatMesh> = new Pbf<IFlatMesh>(buffer);
        return MeshReader.readMesh(pbf);
    }

    private static readMesh(pbf: Pbf<IFlatMesh>): IMesh {
        let flatMesh: IFlatMesh =
            pbf.readFields(MeshReader.readMeshField, { triangles: [], vertices: [] });

        return MeshReader.flatMeshToMesh(flatMesh);
    }

    private static readMeshField(tag: number, flatMesh: IFlatMesh, pbf: Pbf<IFlatMesh>): void {
        if (tag === 1) {
            flatMesh.vertices.push(pbf.readFloat());
        } else if (tag === 2) {
            flatMesh.triangles.push(pbf.readVarint());
        }
    }

    private static flatMeshToMesh(flatMesh: IFlatMesh): IMesh {
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
