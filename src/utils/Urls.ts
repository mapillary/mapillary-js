export class Urls {
    public static dynamicImage(key: string, size: number): string {
        return `https://d2qb1440i7l50o.cloudfront.net/${key}/full/!${size},${size}/0/default.jpg?origin=mapillary.webgl`;
    }

    public static thumbnail(key: string, size: number): string {
        return `https://d1cuyjsrcm0gby.cloudfront.net/${key}/thumb-${size}.jpg?origin=mapillary.webgl`;
    }

    public static falcorModel(clientId: string): string {
        return `https://a.mapillary.com/v3/model.json?client_id=${clientId}`;
    }

    public static protoMesh(key: string): string {
        return `https://d1brzeo354iq2l.cloudfront.net/v2/mesh/${key}`;
    }
}

export default Urls;
