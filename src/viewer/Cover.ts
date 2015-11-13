export class Cover {
    private container: any;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public destroy(): void {
        this.container.style.backgroundImage = "";
    }

    public set(key: string): void {
        this.container.style.backgroundImage = "url(https://d1cuyjsrcm0gby.cloudfront.net/" + key + "/thumb-640.jpg)";
    }
}

export default Cover;
