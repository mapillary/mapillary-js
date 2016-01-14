import IRect from "../../ui/interfaces/IRect";

export interface IAPIImOr {
    ca: number;
    captured_at: number;
    key: string;
    lon: number;
    lat: number;
    user: string;
    or_rects: Array<IRect>;
}

export default IAPIImOr;





