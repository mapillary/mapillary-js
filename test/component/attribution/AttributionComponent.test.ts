import { formatCaptureDate } from "../../../src/component/attribution/AttributionComponent";

const capturedAt = new Date(2021, 9, 26, 12).getTime();

describe("formatCaptureDate", () => {
    it("uses an abbreviated month", () => {
        expect(formatCaptureDate(capturedAt, false, "en-US"))
            .toBe("Oct 26, 2021");
    });

    it("lets Intl determine locale ordering", () => {
        const format = jasmine.createSpy("format")
            .and.returnValue("26 Oct 2021");
        const dateTimeFormat = spyOn(Intl, "DateTimeFormat")
            .and.returnValue({ format } as unknown as Intl.DateTimeFormat);

        expect(formatCaptureDate(capturedAt, false, "en-GB"))
            .toBe("26 Oct 2021");
        expect(dateTimeFormat).toHaveBeenCalledWith(
            "en-GB",
            { day: "numeric", month: "short", year: "numeric" });
        expect(format).toHaveBeenCalledWith(new Date(capturedAt));
    });

    it("keeps compact attribution year-only", () => {
        expect(formatCaptureDate(capturedAt, true, "en-US"))
            .toBe("2021");
        expect(formatCaptureDate(capturedAt, true, "ja-JP"))
            .toBe("2021");
    });

    it("uses the capture timezone for the date and compact year", () => {
        const nearMidnight = Date.UTC(2021, 0, 1, 0, 30);

        expect(formatCaptureDate(
            nearMidnight,
            false,
            "en-US",
            "America/Los_Angeles"))
            .toBe("Dec 31, 2020");
        expect(formatCaptureDate(
            nearMidnight,
            true,
            "en-US",
            "America/Los_Angeles"))
            .toBe("2020");
        expect(formatCaptureDate(
            nearMidnight,
            false,
            "en-US",
            "Europe/Zurich"))
            .toBe("Jan 1, 2021");

        const minnesotaCapture = 1759293346261;
        expect(formatCaptureDate(
            minnesotaCapture,
            false,
            "en-US",
            "America/Chicago"))
            .toBe("Sep 30, 2025");
        expect(formatCaptureDate(
            minnesotaCapture,
            false,
            "en-US",
            "Europe/Rome"))
            .toBe("Oct 1, 2025");
    });

    it("falls back to UTC for an invalid timezone", () => {
        const nearMidnight = Date.UTC(2021, 0, 1, 0, 30);

        expect(formatCaptureDate(
            nearMidnight,
            false,
            "en-US",
            "invalid"))
            .toBe("Jan 1, 2021");
    });

    it("preserves the invalid date fallback", () => {
        expect(formatCaptureDate(NaN, false, "en-US"))
            .toBe("Invalid Date");
    });
});
