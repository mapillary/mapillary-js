export class Urls {
    public static image(key: string, size: number): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/thumb-${size}.jpg?origin=mapillary.webgl`;
    }

    public static falcorModel(clientId: string): string {
        return `http://mapillary-vector.mapillary.io/v3/model.json?client_id=${clientId}`;
    }

    public static falcorModelMagic(clientId: string): string {
        return `https://a.mapillary.com/v3/model.json?client_id=${clientId}`;
    }

    public static mesh(key: string): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/sfm/v1.0/atomic_mesh.json`;
    }

    public static proto_mesh(key: string): string {
        return `https://d1brzeo354iq2l.cloudfront.net/v2/mesh/${key}`;
    }
}

export default Urls;
