export class Urls {
    public static image(key: string, size: number): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/thumb-${size}.jpg?origin=mapillary.webgl`;
    }

    public static mesh(key: string): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/sfm/v1.0/atomic_mesh.json`;
    }
}

export default Urls;
