import {ILatLon} from "../../API";
import {Viewer} from "../../Viewer";

export interface IViewerMouseEvent {
    basicPoint: number[];
    latLon: ILatLon;
    pixelPoint: number[];
    originalEvent: MouseEvent;
    target: Viewer;
    type: string;
}

export default IViewerMouseEvent;
