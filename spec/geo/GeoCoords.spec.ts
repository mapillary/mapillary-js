/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

import {GeoCoords, ILatLonAlt} from "../../src/Geo";

let precision: number = 8;

let wgs84a: number = 6378137;
let wgs84b: number = 6356752.31424518;

describe("GeoCoords.geodeticToEcef", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert Equator - Greenwich to X axis value", () => {
        let position: ILatLonAlt = { lat: 0, lon: 0, alt: 0 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert positions on Equator to WGS84 a distance", () => {
        let position1: ILatLonAlt = { lat: 0, lon: 90, alt: 0 };

        let ecef1: number[] = geoCoords.geodeticToEcef(position1.lat, position1.lon, position1.alt);

        expect(ecef1[0]).toBeCloseTo(0, precision);
        expect(ecef1[1]).toBeCloseTo(wgs84a, precision);
        expect(ecef1[2]).toBeCloseTo(0, precision);

        let position2: ILatLonAlt = { lat: 0, lon: 180, alt: 0 };

        let ecef2: number[] = geoCoords.geodeticToEcef(position2.lat, position2.lon, position2.alt);

        expect(ecef2[0]).toBeCloseTo(-wgs84a, precision);
        expect(ecef2[1]).toBeCloseTo(0, precision);
        expect(ecef2[2]).toBeCloseTo(0, precision);

        let position3: ILatLonAlt = { lat: 0, lon: -90, alt: 0 };

        let ecef3: number[] = geoCoords.geodeticToEcef(position3.lat, position3.lon, position3.alt);

        expect(ecef3[0]).toBeCloseTo(0, precision);
        expect(ecef3[1]).toBeCloseTo(-wgs84a, precision);
        expect(ecef3[2]).toBeCloseTo(0, precision);
    });


    it("should convert random Equator postion correctly", () => {
        let position: ILatLonAlt = { lat: 0, lon: 35.6589, alt: 0 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a * Math.cos(Math.PI * position.lon / 180), precision);
        expect(ecef[1]).toBeCloseTo(wgs84a * Math.sin(Math.PI * position.lon / 180), precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert value with altitude correctly", () => {
        let position: ILatLonAlt = { lat: 0, lon: 0, alt: 452.43537987 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a + position.alt, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert North Pole value correctly", () => {
        let position: ILatLonAlt = { lat: 90, lon: 0, alt: 0 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(0, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(wgs84b, precision);
    });

    it("should convert back and forth between WGS84 and ECEF and correspond", () => {
        let position: ILatLonAlt = { lat: 12.469889789, lon: -33.34589734, alt: 25.34543543 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);
        let rePosition: number[] = geoCoords.ecefToGeodetic(ecef[0], ecef[1], ecef[2]);

        expect(rePosition[0]).toBeCloseTo(position.lat, precision);
        expect(rePosition[1]).toBeCloseTo(position.lon, precision);
        expect(rePosition[2]).toBeCloseTo(position.alt, precision);
    });
});

describe("GeoCoords.ecefToGeodetic", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert X-axis value to Equator - Greenwich", () => {
        let ecef: number[] = [wgs84a, 0, 0];

        let position: number[] = geoCoords.ecefToGeodetic(ecef[0], ecef[1], ecef[2]);

        expect(position[0]).toBeCloseTo(0, precision);
        expect(position[1]).toBeCloseTo(0, precision);
        expect(position[2]).toBeCloseTo(0, precision);
    });

    it("should convert XY-axis values to Equator", () => {
        let ecef1: number[] = [0, wgs84a, 0];

        let position1: number[] = geoCoords.ecefToGeodetic(ecef1[0], ecef1[1], ecef1[2]);

        expect(position1[0]).toBeCloseTo(0, precision);
        expect(position1[1]).toBeCloseTo(90, precision);
        expect(position1[2]).toBeCloseTo(0, precision);

        let ecef2: number[] = [-wgs84a, 0, 0];

        let position2: number[] = geoCoords.ecefToGeodetic(ecef2[0], ecef2[1], ecef2[2]);

        expect(position2[0]).toBeCloseTo(0, precision);
        expect(position2[1]).toBeCloseTo(180, precision);
        expect(position2[2]).toBeCloseTo(0, precision);

        let ecef3: number[] = [0, -wgs84a, 0];

        let position3: number[] = geoCoords.ecefToGeodetic(ecef3[0], ecef3[1], ecef3[2]);

        expect(position3[0]).toBeCloseTo(0, precision);
        expect(position3[1]).toBeCloseTo(-90, precision);
        expect(position3[2]).toBeCloseTo(0, precision);
    });

    it("should convert X-axis value to correct altitude", () => {
        let offset: number = 65.343454534;

        let ecef: number[] = [wgs84a + offset, 0, 0];

        let position: number[] = geoCoords.ecefToGeodetic(ecef[0], ecef[1], ecef[2]);

        expect(position[0]).toBeCloseTo(0, precision);
        expect(position[1]).toBeCloseTo(0, precision);
        expect(position[2]).toBeCloseTo(offset, precision);
    });

    it("should convert back and forth between ECEF and WGS84 and correspond", () => {
        let ecef: number[] = [wgs84a * Math.sin(Math.PI / 6), wgs84a * Math.sin(Math.PI / 6), 22.433453];

        let position: number[] = geoCoords.ecefToGeodetic(ecef[0], ecef[1], ecef[2]);
        let reEcef: number[] = geoCoords.geodeticToEcef(position[0], position[1], position[2]);

        expect(reEcef[0]).toBeCloseTo(ecef[0], precision);
        expect(reEcef[1]).toBeCloseTo(ecef[1], precision);
        expect(reEcef[2]).toBeCloseTo(ecef[2], precision);
    });
});

describe("GeoCoords.geodeticToEnu", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert to ENU position at origin when lla is at reference", () => {
        let ref: ILatLonAlt = { lat: 12.9450823, lon: 133.34589734, alt: 12.523892390 };
        let lla: ILatLonAlt = { lat: ref.lat, lon: ref.lon, alt: ref.alt };

        let enu: number[] = geoCoords.geodeticToEnu(lla.lat, lla.lon, lla.alt, ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(0, precision);
        expect(enu[1]).toBeCloseTo(0, precision);
        expect(enu[2]).toBeCloseTo(0, precision);
    });

    it("should convert to ENU z value corresponding to diff with reference lla", () => {
        let ref: ILatLonAlt = { lat: 12.9450823, lon: 133.34589734, alt: 12.523892390 };

        let altTranslation: number = 4.4556433242;
        let lla: ILatLonAlt = { lat: ref.lat, lon: ref.lon, alt: ref.alt + altTranslation };

        let enu: number[] = geoCoords.geodeticToEnu(lla.lat, lla.lon, lla.alt, ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(0, precision);
        expect(enu[1]).toBeCloseTo(0, precision);
        expect(enu[2]).toBeCloseTo(altTranslation, precision);
    });

    it("should convert back and forth between WGS84 and ENU and correspond", () => {
        let ref: ILatLonAlt = { lat: 13.469889789, lon: 92.376689734, alt: -3.645563324 };
        let lla: ILatLonAlt = { lat: ref.lat - 0.01, lon: ref.lon + 0.01, alt: ref.alt + 20 };

        let enu: number[] = geoCoords.geodeticToEnu(lla.lat, lla.lon, lla.alt, ref.lat, ref.lon, ref.alt);
        let reLla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(reLla[0]).toBeCloseTo(lla.lat, precision);
        expect(reLla[1]).toBeCloseTo(lla.lon, precision);
        expect(reLla[2]).toBeCloseTo(lla.alt, precision);
    });
});

describe("GeoCoords.enuToGeodetic", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert to reference WGS84 when ENU position is origin", () => {
        let ref: ILatLonAlt = { lat: 12.9450823, lon: 133.34589734, alt: 12.523892390 };
        let enu: number[] = [0, 0, 0];

        let lla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(lla[0]).toBeCloseTo(ref.lat, precision);
        expect(lla[1]).toBeCloseTo(ref.lon, precision);
        expect(lla[2]).toBeCloseTo(ref.alt, precision);
    });

    it("should convert to reference WGS84 at correct altitude when ENU position has non zero z value", () => {
        let ref: ILatLonAlt = { lat: 12.9450823, lon: 133.34589734, alt: 12.523892390 };
        let enu: number[] = [0, 0, 5.234872384927];

        let lla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(lla[0]).toBeCloseTo(ref.lat, precision);
        expect(lla[1]).toBeCloseTo(ref.lon, precision);
        expect(lla[2]).toBeCloseTo(ref.alt + enu[2], precision);
    });

    it("should convert back and forth between ENU and WGS84 and correspond", () => {
        let ref: ILatLonAlt = { lat: -52.469889789, lon: -113.34589734, alt: 7.34543543 };
        let enu: number[] = [12.435534543, -55.34242121, 5.98023489];

        let lla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);
        let reEnu: number[] = geoCoords.geodeticToEnu(lla[0], lla[1], lla[2], ref.lat, ref.lon, ref.alt);

        expect(reEnu[0]).toBeCloseTo(enu[0], precision);
        expect(reEnu[1]).toBeCloseTo(enu[1], precision);
        expect(reEnu[2]).toBeCloseTo(enu[2], precision);
    });
});
