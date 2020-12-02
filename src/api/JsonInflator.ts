import * as pako from "pako";

export class JsonInflator {
    public static decompress<T>(buffer: ArrayBuffer): T {
        const inflated: string =
            pako.inflate(<pako.Data>buffer, { to: "string" });

        return <T>JSON.parse(inflated);
    }
}

export default JsonInflator;
