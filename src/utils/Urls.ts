export class Urls {
    public static image(key: string, size: number): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/thumb-${size}.jpg?origin=mapillary.webgl`;
    }

    public static mesh(key: string): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/sfm/v1.0/atomic_mesh.json`;
    }

    public static proto_mesh(key: string): string {
        return `http://mapillary-mesh2pbf.mapillary.io/mesh/${key}`;
    }
}

export default Urls;
