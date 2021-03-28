import { LngLatAlt } from "../../src/api/interfaces/LngLatAlt";
import {
    ecefToEnu,
    ecefToGeodetic,
    enuToEcef,
    enuToGeodetic,
    geodeticToEcef,
    geodeticToEnu,
} from "../../src/geo/GeoCoords";

const precision = 8;

const wgs84a = 6378137;
const wgs84b = 6356752.31424518;

describe("GeoCoords.geodeticToEcef", () => {
    it("should convert Equator - Greenwich to X axis value", () => {
        const position: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        const ecef = geodeticToEcef(
            position.lng,
            position.lat,
            position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert positions on Equator to WGS84 a distance", () => {
        const position1: LngLatAlt = { alt: 0, lat: 0, lng: 90 };

        const ecef1 = geodeticToEcef(
            position1.lng,
            position1.lat,
            position1.alt);

        expect(ecef1[0]).toBeCloseTo(0, precision);
        expect(ecef1[1]).toBeCloseTo(wgs84a, precision);
        expect(ecef1[2]).toBeCloseTo(0, precision);

        const position2: LngLatAlt = { alt: 0, lat: 0, lng: 180 };

        const ecef2 = geodeticToEcef(
            position2.lng,
            position2.lat,
            position2.alt);

        expect(ecef2[0]).toBeCloseTo(-wgs84a, precision);
        expect(ecef2[1]).toBeCloseTo(0, precision);
        expect(ecef2[2]).toBeCloseTo(0, precision);

        const position3: LngLatAlt = { alt: 0, lat: 0, lng: -90 };

        const ecef3 = geodeticToEcef(
            position3.lng,
            position3.lat,
            position3.alt);

        expect(ecef3[0]).toBeCloseTo(0, precision);
        expect(ecef3[1]).toBeCloseTo(-wgs84a, precision);
        expect(ecef3[2]).toBeCloseTo(0, precision);
    });

    it("should convert random Equator postion correctly", () => {
        const position: LngLatAlt = { alt: 0, lat: 0, lng: 35.6589 };

        const ecef = geodeticToEcef(
            position.lng,
            position.lat,
            position.alt);

        expect(ecef[0])
            .toBeCloseTo(
                wgs84a * Math.cos(Math.PI * position.lng / 180),
                precision);

        expect(ecef[1])
            .toBeCloseTo(
                wgs84a * Math.sin(Math.PI * position.lng / 180),
                precision);

        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert value with altitude correctly", () => {
        const position: LngLatAlt = { alt: 452.43537987, lat: 0, lng: 0 };

        const ecef = geodeticToEcef(
            position.lng,
            position.lat,
            position.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a + position.alt, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert North Pole value correctly", () => {
        const position: LngLatAlt = { alt: 0, lat: 90, lng: 0 };

        const ecef = geodeticToEcef(
            position.lng,
            position.lat,
            position.alt);

        expect(ecef[0]).toBeCloseTo(0, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(wgs84b, precision);
    });

    it("should convert back and forth between WGS84 and ECEF and correspond", () => {
        const position: LngLatAlt = {
            alt: 25.34543543,
            lat: 12.469889789,
            lng: -33.34589734,
        };

        const ecef = geodeticToEcef(
            position.lng,
            position.lat,
            position.alt);

        const [lng, lat, alt] = ecefToGeodetic(ecef[0], ecef[1], ecef[2]);

        expect(lng).toBeCloseTo(position.lng, precision);
        expect(lat).toBeCloseTo(position.lat, precision);
        expect(alt).toBeCloseTo(position.alt, precision);
    });
});

describe("GeoCoords.ecefToGeodetic", () => {
    it("should convert X-axis value to Equator - Greenwich", () => {
        const ecef = [wgs84a, 0, 0];

        const [lng, lat, alt] = ecefToGeodetic(ecef[0], ecef[1], ecef[2]);

        expect(lng).toBeCloseTo(0, precision);
        expect(lat).toBeCloseTo(0, precision);
        expect(alt).toBeCloseTo(0, precision);
    });

    it("should convert XY-axis values to Equator", () => {
        const ecef1 = [0, wgs84a, 0];

        const [lng1, lat1, alt1] = ecefToGeodetic(ecef1[0], ecef1[1], ecef1[2]);

        expect(lng1).toBeCloseTo(90, precision);
        expect(lat1).toBeCloseTo(0, precision);
        expect(alt1).toBeCloseTo(0, precision);

        const ecef2 = [-wgs84a, 0, 0];

        const [lng2, lat2, alt2] = ecefToGeodetic(ecef2[0], ecef2[1], ecef2[2]);

        expect(lng2).toBeCloseTo(180, precision);
        expect(lat2).toBeCloseTo(0, precision);
        expect(alt2).toBeCloseTo(0, precision);

        const ecef3 = [0, -wgs84a, 0];

        const [lng3, lat3, alt3] = ecefToGeodetic(ecef3[0], ecef3[1], ecef3[2]);

        expect(lng3).toBeCloseTo(-90, precision);
        expect(lat3).toBeCloseTo(0, precision);
        expect(alt3).toBeCloseTo(0, precision);
    });

    it("should convert X-axis value to correct altitude", () => {
        const offset = 65.343454534;

        const ecef = [wgs84a + offset, 0, 0];

        const [lng, lat, alt] = ecefToGeodetic(ecef[0], ecef[1], ecef[2]);

        expect(lng).toBeCloseTo(0, precision);
        expect(lat).toBeCloseTo(0, precision);
        expect(alt).toBeCloseTo(offset, precision);
    });

    it("should convert back and forth between ECEF and WGS84 and correspond", () => {
        const ecef = [
            wgs84a * Math.sin(Math.PI / 6),
            wgs84a * Math.sin(Math.PI / 6),
            22.433453,
        ];

        const [lng, lat, alt] = ecefToGeodetic(ecef[0], ecef[1], ecef[2]);
        const reEcef = geodeticToEcef(lng, lat, alt);

        expect(reEcef[0]).toBeCloseTo(ecef[0], precision);
        expect(reEcef[1]).toBeCloseTo(ecef[1], precision);
        expect(reEcef[2]).toBeCloseTo(ecef[2], precision);
    });
});

describe("GeoCoords.ecefToEnu", () => {
    it("should convert to ECEF position corresponding to geodetic to ENU at origin", () => {
        const ref: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        const ecef = [wgs84a, 0, 0];

        const [x, y, z] = ecefToEnu(
            ecef[0],
            ecef[1],
            ecef[2],
            ref.lng,
            ref.lat,
            ref.alt);

        expect(x).toBeCloseTo(0, precision);
        expect(y).toBeCloseTo(0, precision);
        expect(z).toBeCloseTo(0, precision);
    });

    it("should convert positions on Equator to ENU positions at origin", () => {
        const ref1: LngLatAlt = { alt: 0, lat: 0, lng: 90 };
        const ecef1 = [0, wgs84a, 0];

        const [x1, y1, z1] = ecefToEnu(
            ecef1[0],
            ecef1[1],
            ecef1[2],
            ref1.lng,
            ref1.lat,
            ref1.alt);

        expect(x1).toBeCloseTo(0, precision);
        expect(y1).toBeCloseTo(0, precision);
        expect(z1).toBeCloseTo(0, precision);

        const ref2: LngLatAlt = { alt: 0, lat: 0, lng: 180 };
        const ecef2 = [-wgs84a, 0, 0];

        const [x2, y2, z2] = ecefToEnu(
            ecef2[0],
            ecef2[1],
            ecef2[2],
            ref2.lng,
            ref2.lat,
            ref2.alt);

        expect(x2).toBeCloseTo(0, precision);
        expect(y2).toBeCloseTo(0, precision);
        expect(z2).toBeCloseTo(0, precision);

        const ref3: LngLatAlt = { alt: 0, lat: 0, lng: -90 };
        const ecef3 = [0, -wgs84a, 0];

        const [x3, y3, z3] = ecefToEnu(
            ecef3[0],
            ecef3[1],
            ecef3[2],
            ref3.lng,
            ref3.lat,
            ref3.alt);

        expect(x3).toBeCloseTo(0, precision);
        expect(y3).toBeCloseTo(0, precision);
        expect(z3).toBeCloseTo(0, precision);
    });

    it(
        "should convert ECEF position with " +
        "altitude to ENU with correct z-value",
        () => {
            const ref: LngLatAlt = { alt: 0, lat: 0, lng: 0 };

            const altitude = 5.38973284;
            const ecef = [wgs84a + altitude, 0, 0];

            const [x, y, z] = ecefToEnu(
                ecef[0],
                ecef[1],
                ecef[2],
                ref.lng,
                ref.lat,
                ref.alt);

            expect(x).toBeCloseTo(0, precision);
            expect(y).toBeCloseTo(0, precision);
            expect(z).toBeCloseTo(altitude, precision);
        });

    it(
        "should convert ECEF position with translation to correct ENU position",
        () => {
            const ref: LngLatAlt = { alt: 0, lat: 0, lng: 0 };

            const translation = 1.38973284;
            const ecef = [wgs84a, translation, translation];

            const [x, y, z] = ecefToEnu(
                ecef[0],
                ecef[1],
                ecef[2],
                ref.lng,
                ref.lat,
                ref.alt);

            expect(x).toBeCloseTo(translation, precision);
            expect(y).toBeCloseTo(translation, precision);
            expect(z).toBeCloseTo(0, precision);
        });
});

describe("GeoCoords.enuToEcef", () => {
    it("should convert to ENU position at origin to ECEF X-value", () => {
        const ref: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        const enu = [0, 0, 0];

        const ecef = enuToEcef(
            enu[0],
            enu[1],
            enu[2],
            ref.lng,
            ref.lat,
            ref.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert to ENU position with up value to ECEF X-value", () => {
        const ref: LngLatAlt = { alt: 0, lat: 0, lng: 0 };
        const enu = [0, 0, 7.3823847239847];

        const ecef = enuToEcef(
            enu[0],
            enu[1],
            enu[2],
            ref.lng,
            ref.lat,
            ref.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a + enu[2], precision);
        expect(ecef[1]).toBeCloseTo(0, precision);
        expect(ecef[2]).toBeCloseTo(0, precision);
    });

    it("should convert ECEF position with translation to correct ENU position", () => {
        const ref: LngLatAlt = { alt: 0, lat: 0, lng: 0 };

        const translation = -2.34875843758493;
        const enu = [translation, translation, 0];

        const ecef = enuToEcef(
            enu[0],
            enu[1],
            enu[2],
            ref.lng,
            ref.lat,
            ref.alt);

        expect(ecef[0]).toBeCloseTo(wgs84a, precision);
        expect(ecef[1]).toBeCloseTo(translation, precision);
        expect(ecef[2]).toBeCloseTo(translation, precision);
    });
});

describe("GeoCoords.geodeticToEnu", () => {
    it("should convert to ENU position at origin when lla is at reference", () => {
        const ref: LngLatAlt = {
            alt: 12.523892390,
            lat: 12.9450823,
            lng: 133.34589734,
        };
        const lla: LngLatAlt = {
            alt: ref.alt,
            lat: ref.lat,
            lng: ref.lng,
        };

        const [x, y, z] = geodeticToEnu(
            lla.lng,
            lla.lat,
            lla.alt,
            ref.lng,
            ref.lat,
            ref.alt);

        expect(x).toBeCloseTo(0, precision);
        expect(y).toBeCloseTo(0, precision);
        expect(z).toBeCloseTo(0, precision);
    });

    it(
        "should convert to ENU z value corresponding" +
        "to diff with reference lla",
        () => {
            const ref: LngLatAlt = {
                alt: 12.523892390,
                lat: 12.9450823,
                lng: 133.34589734,
            };

            const altTranslation = 4.4556433242;
            const lla: LngLatAlt = {
                alt: ref.alt + altTranslation,
                lat: ref.lat,
                lng: ref.lng,
            };

            const [x, y, z] = geodeticToEnu(
                lla.lng,
                lla.lat,
                lla.alt,
                ref.lng,
                ref.lat,
                ref.alt);

            expect(x).toBeCloseTo(0, precision);
            expect(y).toBeCloseTo(0, precision);
            expect(z).toBeCloseTo(altTranslation, precision);
        });

    it(
        "should convert back and forth between WGS84 and ENU and correspond",
        () => {
            const ref: LngLatAlt = {
                alt: -3.645563324,
                lat: 13.469889789,
                lng: 92.376689734,
            };

            const lla: LngLatAlt = {
                alt: ref.alt + 20,
                lat: ref.lat - 0.01,
                lng: ref.lng + 0.01,
            };

            const [x, y, z] = geodeticToEnu(
                lla.lng,
                lla.lat,
                lla.alt,
                ref.lng,
                ref.lat,
                ref.alt);

            const [lng, lat, alt] = enuToGeodetic(
                x,
                y,
                z,
                ref.lng,
                ref.lat,
                ref.alt);

            expect(lng).toBeCloseTo(lla.lng, precision);
            expect(lat).toBeCloseTo(lla.lat, precision);
            expect(alt).toBeCloseTo(lla.alt, precision);
        });
});

describe("GeoCoords.enuToGeodetic", () => {
    it("should convert to reference WGS84 when ENU position is origin", () => {
        const ref: LngLatAlt = {
            alt: 12.523892390,
            lat: 12.9450823,
            lng: 133.34589734,
        };
        const enu = [0, 0, 0];

        const [lng, lat, alt] = enuToGeodetic(
            enu[0],
            enu[1],
            enu[2],
            ref.lng,
            ref.lat,
            ref.alt);

        expect(lng).toBeCloseTo(ref.lng, precision);
        expect(lat).toBeCloseTo(ref.lat, precision);
        expect(alt).toBeCloseTo(ref.alt, precision);
    });

    it("should convert to reference WGS84 at correct altitude when ENU position has non zero z value", () => {
        const ref: LngLatAlt = {
            alt: 12.523892390,
            lat: 12.9450823,
            lng: 133.34589734,
        };
        const enu = [0, 0, 5.234872384927];

        const [lng, lat, alt] = enuToGeodetic(
            enu[0],
            enu[1],
            enu[2],
            ref.lng,
            ref.lat,
            ref.alt);

        expect(lng).toBeCloseTo(ref.lng, precision);
        expect(lat).toBeCloseTo(ref.lat, precision);
        expect(alt).toBeCloseTo(ref.alt + enu[2], precision);
    });

    it("should convert back and forth between ENU and WGS84 and correspond", () => {
        const ref: LngLatAlt = {
            alt: 7.34543543,
            lat: -52.469889789,
            lng: -113.34589734,
        };
        const enu = [12.435534543, -55.34242121, 5.98023489];

        const [lng, lat, alt] = enuToGeodetic(
            enu[0],
            enu[1],
            enu[2],
            ref.lng,
            ref.lat,
            ref.alt);

        const [x, y, z] = geodeticToEnu(
            lng,
            lat,
            alt,
            ref.lng,
            ref.lat,
            ref.alt);

        expect(x).toBeCloseTo(enu[0], precision);
        expect(y).toBeCloseTo(enu[1], precision);
        expect(z).toBeCloseTo(enu[2], precision);
    });
});
