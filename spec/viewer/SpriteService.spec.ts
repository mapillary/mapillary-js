import {skip} from "rxjs/operators";
import {ISpriteAtlas, SpriteService} from "../../src/Viewer";

class XMLHTTPRequestMock {
    public response: string;
    public responseType: string;

    public onload: (e: Event) => any;

    private _extension: string;

    public open(...args: any[]): void {
        this._extension = args[1].split(".").pop();
    }

    public send(...args: any[]): void { return; }

    public fireLoad(extension: string): void {
        if (extension === this._extension) {
            this.onload(new Event("load"));
        }
    }
}

class ImageMock {
    public src: string;
    public onload: (e: Event) => any;
}

describe("SpriteService.ctor", () => {
    it("should be initialized without retrieving sprite", () => {
        let xmlHTTPRequestSpy: jasmine.Spy = spyOn(window, <keyof Window>"XMLHttpRequest");

        let spriteService: SpriteService = new SpriteService();

        expect(xmlHTTPRequestSpy.calls.count()).toBe(0);

        return spriteService;
    });
});

describe("SpriteService.spriteAtlas$", () => {
    it("should emit a defined item when no sprite is provided", (done: Function) => {
        let spriteService: SpriteService = new SpriteService();

        spriteService.spriteAtlas$
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas).toBeDefined();

                    done();
                });
    });

    it("should throw when trying to get a GL sprite for none loaded atlas", (done: Function) => {
        let spriteService: SpriteService = new SpriteService();

        spriteService.spriteAtlas$
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas.loaded).toBe(false);

                    expect(atlas.getGLSprite).toThrowError(Error);

                    done();
                });
    });

    it("should throw when trying to get a GL sprite for none loaded atlas", (done: Function) => {
        let spriteService: SpriteService = new SpriteService();

        spriteService.spriteAtlas$
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas.loaded).toBe(false);

                    expect(atlas.getDOMSprite).toThrowError(Error);

                    done();
                });
    });

    it("should emit an item that is not loaded when no sprite is provided", (done: Function) => {
        let spriteService: SpriteService = new SpriteService();

        spriteService.spriteAtlas$
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas.loaded).toBe(false);

                    done();
                });
    });

    it("should retrieve an image if a sprite is provided", (done: Function) => {
        let pngXmlHTTPRequestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        let jsonXmlHTTPRequestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        let imageMock: ImageMock = new ImageMock();

        let json: boolean = false;

        spyOn(window, <keyof Window>"XMLHttpRequest").and
            .callFake((): XMLHTTPRequestMock => {
                if (json) {
                    return jsonXmlHTTPRequestMock;
                }

                json = true;

                return pngXmlHTTPRequestMock;
            });

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        let imageSpy: jasmine.Spy = spyOn(window, <keyof Window>"Image");
        imageSpy.and.returnValue(imageMock);

        let jsonSpy: jasmine.Spy = spyOn(JSON, "parse");

        let spriteService: SpriteService = new SpriteService("sprite");

        spriteService.spriteAtlas$.pipe(
            skip(1))
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas.loaded).toBe(false);

                    expect(imageSpy.calls.count()).toBe(1);
                    expect(jsonSpy.calls.count()).toBe(0);

                    done();
                });

        pngXmlHTTPRequestMock.fireLoad("png");
        imageMock.onload(new Event("load"));
    });

    it("should retrieve json definition if a sprite is provided", (done: Function) => {
        let pngXmlHTTPRequestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        let jsonXmlHTTPRequestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();

        let json: boolean = false;

        spyOn(window, <keyof Window>"XMLHttpRequest").and
            .callFake((): XMLHTTPRequestMock => {
                if (json) {
                    return jsonXmlHTTPRequestMock;
                }

                json = true;

                return pngXmlHTTPRequestMock;
            });

        let imageSpy: jasmine.Spy = spyOn(window, <keyof Window>"Image");
        let jsonSpy: jasmine.Spy = spyOn(JSON, "parse");
        jsonSpy.and.returnValue({});

        let spriteService: SpriteService = new SpriteService("sprite");

        spriteService.spriteAtlas$.pipe(
            skip(1))
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas.loaded).toBe(false);

                    expect(imageSpy.calls.count()).toBe(0);
                    expect(jsonSpy.calls.count()).toBe(1);

                    done();
                });

        jsonXmlHTTPRequestMock.fireLoad("json");
    });

    it("should be loaded when both image and json has been retrieved", (done: Function) => {
        let pngXmlHTTPRequestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        let jsonXmlHTTPRequestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        let imageMock: ImageMock = new ImageMock();

        let json: boolean = false;

        spyOn(window, <keyof Window>"XMLHttpRequest").and
            .callFake((): XMLHTTPRequestMock => {
                if (json) {
                    return jsonXmlHTTPRequestMock;
                }

                json = true;

                return pngXmlHTTPRequestMock;
            });

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        let imageSpy: jasmine.Spy = spyOn(window, <keyof Window>"Image");
        imageSpy.and.returnValue(imageMock);

        let jsonSpy: jasmine.Spy = spyOn(JSON, "parse");
        jsonSpy.and.returnValue({});

        let spriteService: SpriteService = new SpriteService("sprite");

        spriteService.spriteAtlas$.pipe(
            skip(2))
            .subscribe(
                (atlas: ISpriteAtlas): void => {
                    expect(atlas.loaded).toBe(true);

                    expect(imageSpy.calls.count()).toBe(1);
                    expect(jsonSpy.calls.count()).toBe(1);

                    done();
                });

        pngXmlHTTPRequestMock.fireLoad("png");
        imageMock.onload(new Event("load"));

        jsonXmlHTTPRequestMock.fireLoad("json");
    });
});
