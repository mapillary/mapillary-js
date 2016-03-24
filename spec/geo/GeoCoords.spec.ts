/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

import {GeoCoords, ILatLonAlt} from "../../src/Geo";

describe("GeoCoords.llaToEcef", () => {
    let precision: number = 8;
    let wgs84a: number = 6378137;
    let wgs84b: number = 6356752.31424518;

    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert Equator - Greenwich to X axis value", () => {
        let position: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };

        let ecef: number[] = geoCoords.llaToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert positions on Equator to WGS84 a distance", () => {
        let position1: ILatLonAlt = { lat: 0, lon: 90, alt: 0 };

        let ecef1: number[] = geoCoords.llaToEcef(position1.lat, position1.lon, position1.alt);

        expect(ecef1[0]).toBeCloseTo(0, precision);
        expect(ecef1[1]).toBeCloseTo(wgs84a, precision);
        expect(ecef1[2]).toBeCloseTo(0, precision);

        let position2: ILatLonAlt = { lat: 0, lon: 180, alt: 0 };

        let ecef2: number[] = geoCoords.llaToEcef(position2.lat, position2.lon, position2.alt);

        expect(ecef2[0]).toBeCloseTo(-wgs84a, precision);
        expect(ecef2[1]).toBeCloseTo(0, precision);
        expect(ecef2[2]).toBeCloseTo(0, precision);

        let position3: ILatLonAlt = { lat: 0, lon: -90, alt: 0 };

        let ecef3: number[] = geoCoords.llaToEcef(position3.lat, position3.lon, position3.alt);

        expect(ecef3[0]).toBeCloseTo(0, precision);
        expect(ecef3[1]).toBeCloseTo(-wgs84a, precision);
        expect(ecef3[2]).toBeCloseTo(0, precision);
    });


    it("should convert random Equator postion correctly", () => {
        let position: ILatLonAlt = { lat: 0, lon: 35.6589, alt: 0 };

        let ecef: number[] = geoCoords.llaToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a * Math.cos(Math.PI * position.lon / 180), precision);
        expect(ecef[1]).toBeCloseTo(wgs84a * Math.sin(Math.PI * position.lon / 180), precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert value with altitude correctly", () => {
        let position: ILatLonAlt = { lat: 0, lon: 0, alt: 452.43537987 };

        let ecef: number[] = geoCoords.llaToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a + position.alt, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert North Pole value correctly", () => {
        let position: ILatLonAlt = { lat: 90, lon: 0, alt: 0 };

        let ecef: number[] = geoCoords.llaToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(0, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(wgs84b, precision);
    });
});
