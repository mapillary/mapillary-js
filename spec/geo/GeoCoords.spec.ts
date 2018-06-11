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
        let position: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert positions on Equator to WGS84 a distance", () => {
        let position1: ILatLonAlt = { alt: 0, lat: 0, lon: 90 };

        let ecef1: number[] = geoCoords.geodeticToEcef(position1.lat, position1.lon, position1.alt);

        expect(ecef1[0]).toBeCloseTo(0, precision);
        expect(ecef1[1]).toBeCloseTo(wgs84a, precision);
        expect(ecef1[2]).toBeCloseTo(0, precision);

        let position2: ILatLonAlt = { alt: 0, lat: 0, lon: 180 };

        let ecef2: number[] = geoCoords.geodeticToEcef(position2.lat, position2.lon, position2.alt);

        expect(ecef2[0]).toBeCloseTo(-wgs84a, precision);
        expect(ecef2[1]).toBeCloseTo(0, precision);
        expect(ecef2[2]).toBeCloseTo(0, precision);

        let position3: ILatLonAlt = { alt: 0, lat: 0, lon: -90 };

        let ecef3: number[] = geoCoords.geodeticToEcef(position3.lat, position3.lon, position3.alt);

        expect(ecef3[0]).toBeCloseTo(0, precision);
        expect(ecef3[1]).toBeCloseTo(-wgs84a, precision);
        expect(ecef3[2]).toBeCloseTo(0, precision);
    });

    it("should convert random Equator postion correctly", () => {
        let position: ILatLonAlt = { alt: 0, lat: 0, lon: 35.6589 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a * Math.cos(Math.PI * position.lon / 180), precision);
        expect(ecef[1]).toBeCloseTo(wgs84a * Math.sin(Math.PI * position.lon / 180), precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert value with altitude correctly", () => {
        let position: ILatLonAlt = { alt: 452.43537987, lat: 0, lon: 0 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a + position.alt, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert North Pole value correctly", () => {
        let position: ILatLonAlt = { alt: 0, lat: 90, lon: 0 };

        let ecef: number[] = geoCoords.geodeticToEcef(position.lat, position.lon, position.alt);

        expect(ecef[0]).toBeCloseTo(0, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(wgs84b, precision);
    });

    it("should convert back and forth between WGS84 and ECEF and correspond", () => {
        let position: ILatLonAlt = { alt: 25.34543543, lat: 12.469889789, lon: -33.34589734 };

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

describe("GeoCoords.ecefToEnu", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert to ECEF position corresponding to geodetic to ENU at origin", () => {
        let ref: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let ecef: number[] = [wgs84a, 0, 0];

        let enu: number[] = geoCoords.ecefToEnu(ecef[0], ecef[1], ecef[2], ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(0, precision);
        expect(enu[1]).toBeCloseTo(0, precision);
        expect(enu[2]).toBeCloseTo(0, precision);
    });

    it("should convert positions on Equator to ENU positions at origin", () => {
        let ref1: ILatLonAlt = { alt: 0, lat: 0, lon: 90 };
        let ecef1: number[] = [0, wgs84a, 0];

        let enu1: number[] = geoCoords.ecefToEnu(ecef1[0], ecef1[1], ecef1[2], ref1.lat, ref1.lon, ref1.alt);

        expect(enu1[0]).toBeCloseTo(0, precision);
        expect(enu1[1]).toBeCloseTo(0, precision);
        expect(enu1[2]).toBeCloseTo(0, precision);

        let ref2: ILatLonAlt = { alt: 0, lat: 0, lon: 180 };
        let ecef2: number[] = [-wgs84a, 0, 0];

        let enu2: number[] = geoCoords.ecefToEnu(ecef2[0], ecef2[1], ecef2[2], ref2.lat, ref2.lon, ref2.alt);

        expect(enu2[0]).toBeCloseTo(0, precision);
        expect(enu2[1]).toBeCloseTo(0, precision);
        expect(enu2[2]).toBeCloseTo(0, precision);

        let ref3: ILatLonAlt = { alt: 0, lat: 0, lon: -90 };
        let ecef3: number[] = [0, -wgs84a, 0];

        let enu3: number[] = geoCoords.ecefToEnu(ecef3[0], ecef3[1], ecef3[2], ref3.lat, ref3.lon, ref3.alt);

        expect(enu3[0]).toBeCloseTo(0, precision);
        expect(enu3[1]).toBeCloseTo(0, precision);
        expect(enu3[2]).toBeCloseTo(0, precision);
    });

    it("should convert ECEF position with altitude to ENU with correct z-value", () => {
        let ref: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };

        let altitude: number = 5.38973284;
        let ecef: number[] = [wgs84a + altitude, 0, 0];

        let enu: number[] = geoCoords.ecefToEnu(ecef[0], ecef[1], ecef[2], ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(0, precision);
        expect(enu[1]).toBeCloseTo(0, precision);
        expect(enu[2]).toBeCloseTo(altitude, precision);
    });

    it("should convert ECEF position with translation to correct ENU position", () => {
        let ref: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };

        let translation: number = 1.38973284;
        let ecef: number[] = [wgs84a, translation, translation];

        let enu: number[] = geoCoords.ecefToEnu(ecef[0], ecef[1], ecef[2], ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(translation, precision);
        expect(enu[1]).toBeCloseTo(translation, precision);
        expect(enu[2]).toBeCloseTo(0, precision);
    });
});

describe("GeoCoords.enuToEcef", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert to ENU position at origin to ECEF X-value", () => {
        let ref: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let enu: number[] = [0, 0, 0];

        let ecef: number[] = geoCoords.enuToEcef(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert to ENU position with up value to ECEF X-value", () => {
        let ref: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };
        let enu: number[] = [0, 0, 7.3823847239847];

        let ecef: number[] = geoCoords.enuToEcef(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a + enu[2], precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert ECEF position with translation to correct ENU position", () => {
        let ref: ILatLonAlt = { alt: 0, lat: 0, lon: 0 };

        let translation: number = -2.34875843758493;
        let enu: number[] = [translation, translation, 0];

        let ecef: number[] = geoCoords.enuToEcef(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(translation, precision);
        expect(ecef[2]).toBeCloseTo(translation, precision);
    });
});

describe("GeoCoords.geodeticToEnu", () => {
    let geoCoords: GeoCoords;

    beforeEach(() => {
        geoCoords = new GeoCoords();
    });

    it("should convert to ENU position at origin when lla is at reference", () => {
        let ref: ILatLonAlt = { alt: 12.523892390, lat: 12.9450823, lon: 133.34589734 };
        let lla: ILatLonAlt = { alt: ref.alt, lat: ref.lat, lon: ref.lon };

        let enu: number[] = geoCoords.geodeticToEnu(lla.lat, lla.lon, lla.alt, ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(0, precision);
        expect(enu[1]).toBeCloseTo(0, precision);
        expect(enu[2]).toBeCloseTo(0, precision);
    });

    it("should convert to ENU z value corresponding to diff with reference lla", () => {
        let ref: ILatLonAlt = { alt: 12.523892390, lat: 12.9450823, lon: 133.34589734 };

        let altTranslation: number = 4.4556433242;
        let lla: ILatLonAlt = { alt: ref.alt + altTranslation, lat: ref.lat, lon: ref.lon };

        let enu: number[] = geoCoords.geodeticToEnu(lla.lat, lla.lon, lla.alt, ref.lat, ref.lon, ref.alt);

        expect(enu[0]).toBeCloseTo(0, precision);
        expect(enu[1]).toBeCloseTo(0, precision);
        expect(enu[2]).toBeCloseTo(altTranslation, precision);
    });

    it("should convert back and forth between WGS84 and ENU and correspond", () => {
        let ref: ILatLonAlt = { alt: -3.645563324, lat: 13.469889789, lon: 92.376689734 };
        let lla: ILatLonAlt = { alt: ref.alt + 20, lat: ref.lat - 0.01, lon: ref.lon + 0.01 };

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
        let ref: ILatLonAlt = { alt: 12.523892390, lat: 12.9450823, lon: 133.34589734 };
        let enu: number[] = [0, 0, 0];

        let lla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(lla[0]).toBeCloseTo(ref.lat, precision);
        expect(lla[1]).toBeCloseTo(ref.lon, precision);
        expect(lla[2]).toBeCloseTo(ref.alt, precision);
    });

    it("should convert to reference WGS84 at correct altitude when ENU position has non zero z value", () => {
        let ref: ILatLonAlt = { alt: 12.523892390, lat: 12.9450823, lon: 133.34589734 };
        let enu: number[] = [0, 0, 5.234872384927];

        let lla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);

        expect(lla[0]).toBeCloseTo(ref.lat, precision);
        expect(lla[1]).toBeCloseTo(ref.lon, precision);
        expect(lla[2]).toBeCloseTo(ref.alt + enu[2], precision);
    });

    it("should convert back and forth between ENU and WGS84 and correspond", () => {
        let ref: ILatLonAlt = { alt: 7.34543543, lat: -52.469889789, lon: -113.34589734 };
        let enu: number[] = [12.435534543, -55.34242121, 5.98023489];

        let lla: number[] = geoCoords.enuToGeodetic(enu[0], enu[1], enu[2], ref.lat, ref.lon, ref.alt);
        let reEnu: number[] = geoCoords.geodeticToEnu(lla[0], lla[1], lla[2], ref.lat, ref.lon, ref.alt);

        expect(reEnu[0]).toBeCloseTo(enu[0], precision);
        expect(reEnu[1]).toBeCloseTo(enu[1], precision);
        expect(reEnu[2]).toBeCloseTo(enu[2], precision);
    });
});
