import IRect from "./IRect";

export interface IORResponse {
    ca: number;
    captured_at: number;
    key: string;
    lon: number;
    lat: number;
    user: string;
    or_rects: Array<IRect>;
}

export default IORResponse;
