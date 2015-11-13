/// <reference path="../../typings/when/when.d.ts" />
import {IViewerOptions} from "../Viewer";

export class Cover {
    private initialNode: string;
    private container: any;

    constructor(options: IViewerOptions, container: any) {
        this.initialNode = options.initialNode;

        container.style.backgroundImage = "url(https://d1cuyjsrcm0gby.cloudfront.net/" + this.initialNode + "/thumb-640.jpg)";
    }

    public destroy(): void {
        this.initialNode = undefined;
        this.container.style.backgroundImage = "";
    }

    public update(key: string): void {
      this.container.style.backgroundImage =
          "url(https://d1cuyjsrcm0gby.cloudfront.net/"
          + key
          + "/thumb-640.jpg)";
    }
}

export default Cover;
