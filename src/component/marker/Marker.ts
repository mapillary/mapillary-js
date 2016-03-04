/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

export class Marker {
    public lat: number;
    public lon: number;
    public alt: number;
    public color: number;
    public hash: number;
    public visibleInKeys: string[] = [];

    public self$: rx.Subject<Marker> = new rx.Subject<Marker>();

    constructor(lat: number,
                lon: number,
                alt: number = 0.0) {
        this.setPosition(lat, lon, alt);
        this.setColor(0xCCFFCC);
    }

    public setPosition(lat: number,
                       lon: number,
                       alt: number = 0.0): void {
        this.lat = lat;
        this.lon = lon;
        this.alt = alt;
        this.update();
    }

    public setColor(color: number): void {
        this.color = color;
        this.update();
    }

    public setVisibleInKeys(keys: string[]): void {
        this.visibleInKeys = keys;
        this.update();
    }

    private update(): void {
        this.hash = Math.random();
        this.self$.onNext(this);
    }
}

export default Marker;
