import { refCount, publishReplay, scan, startWith } from "rxjs/operators";
import * as THREE from "three";
import * as vd from "virtual-dom";

import { Observable, Subject, Subscription } from "rxjs";

import { Alignment, ISpriteAtlas } from "../Viewer";

class SpriteAtlas implements ISpriteAtlas {
    private _image: HTMLImageElement;
    private _texture: THREE.Texture;
    private _json: ISprites;

    public set json(value: ISprites) {
        this._json = value;
    }

    public set image(value: HTMLImageElement) {
        this._image = value;
        this._texture = new THREE.Texture(this._image);
        this._texture.minFilter = THREE.NearestFilter;
    }

    public get loaded(): boolean {
        return !!(this._image && this._json);
    }

    public getGLSprite(name: string): THREE.Object3D {
        if (!this.loaded) {
            throw new Error("Sprites cannot be retrieved before the atlas is loaded.");
        }

        let definition: ISprite = this._json[name];

        if (!definition) {
            console.warn("Sprite with key" + name + "does not exist in sprite definition.");

            return new THREE.Object3D();
        }

        let texture: THREE.Texture = this._texture.clone();
        texture.needsUpdate = true;

        let width: number = this._image.width;
        let height: number = this._image.height;

        texture.offset.x = definition.x / width;
        texture.offset.y = (height - definition.y - definition.height) / height;
        texture.repeat.x = definition.width / width;
        texture.repeat.y = definition.height / height;

        let material: THREE.SpriteMaterial = new THREE.SpriteMaterial({ map: texture });

        return new THREE.Sprite(material);
    }

    public getDOMSprite(
        name: string,
        float?: Alignment): vd.VNode {

        if (!this.loaded) {
            throw new Error("Sprites cannot be retrieved before the atlas is loaded.");
        }

        if (float == null) {
            float = Alignment.Center;
        }

        let definition: ISprite = this._json[name];

        if (!definition) {
            console.warn("Sprite with key" + name + "does not exist in sprite definition.");

            return vd.h("div", {}, []);
        }

        let clipTop: number = definition.y;
        let clipRigth: number = definition.x + definition.width;
        let clipBottom: number = definition.y + definition.height;
        let clipLeft: number = definition.x;

        let left: number = -definition.x;
        let top: number = -definition.y;

        let height: number = this._image.height;
        let width: number = this._image.width;

        switch (float) {
            case Alignment.Bottom:
            case Alignment.Center:
            case Alignment.Top:
                left -= definition.width / 2;
                break;
            case Alignment.BottomLeft:
            case Alignment.Left:
            case Alignment.TopLeft:
                left -= definition.width;
                break;
            case Alignment.BottomRight:
            case Alignment.Right:
            case Alignment.TopRight:
            default:
                break;
        }

        switch (float) {
            case Alignment.Center:
            case Alignment.Left:
            case Alignment.Right:
                top -= definition.height / 2;
                break;
            case Alignment.Top:
            case Alignment.TopLeft:
            case Alignment.TopRight:
                top -= definition.height;
                break;
            case Alignment.Bottom:
            case Alignment.BottomLeft:
            case Alignment.BottomRight:
            default:
                break;
        }

        let pixelRatioInverse: number = 1 / definition.pixelRatio;

        clipTop *= pixelRatioInverse;
        clipRigth *= pixelRatioInverse;
        clipBottom *= pixelRatioInverse;
        clipLeft *= pixelRatioInverse;
        left *= pixelRatioInverse;
        top *= pixelRatioInverse;
        height *= pixelRatioInverse;
        width *= pixelRatioInverse;

        let properties: vd.createProperties = {
            src: this._image.src,
            style: {
                clip: `rect(${clipTop}px, ${clipRigth}px, ${clipBottom}px, ${clipLeft}px)`,
                height: `${height}px`,
                left: `${left}px`,
                position: "absolute",
                top: `${top}px`,
                width: `${width}px`,
            },
        };

        return vd.h("img", properties, []);
    }
}

interface ISprite {
    width: number;
    height: number;
    x: number;
    y: number;
    pixelRatio: number;
}

interface ISprites {
    [key: string]: ISprite;
}

interface ISpriteAtlasOperation {
    (atlas: SpriteAtlas): SpriteAtlas;
}

export class SpriteService {
    private _retina: boolean;

    private _spriteAtlasOperation$: Subject<ISpriteAtlasOperation>;
    private _spriteAtlas$: Observable<SpriteAtlas>;

    private _atlasSubscription: Subscription;

    constructor(sprite?: string) {
        this._retina = window.devicePixelRatio > 1;

        this._spriteAtlasOperation$ = new Subject<ISpriteAtlasOperation>();

        this._spriteAtlas$ = this._spriteAtlasOperation$.pipe(
            startWith(
                (atlas: SpriteAtlas): SpriteAtlas => {
                    return atlas;
                }),
            scan(
                (atlas: SpriteAtlas, operation: ISpriteAtlasOperation): SpriteAtlas => {
                    return operation(atlas);
                },
                new SpriteAtlas()),
            publishReplay(1),
            refCount());

        this._atlasSubscription = this._spriteAtlas$
            .subscribe(() => { /*noop*/ });

        if (sprite == null) {
            return;
        }

        let format: string = this._retina ? "@2x" : "";

        let imageXmlHTTP: XMLHttpRequest = new XMLHttpRequest();
        imageXmlHTTP.open("GET", sprite + format + ".png", true);
        imageXmlHTTP.responseType = "arraybuffer";
        imageXmlHTTP.onload = () => {
            let image: HTMLImageElement = new Image();
            image.onload = () => {
                this._spriteAtlasOperation$.next(
                    (atlas: SpriteAtlas): SpriteAtlas => {
                        atlas.image = image;

                        return atlas;
                    });
            };

            let blob: Blob = new Blob([imageXmlHTTP.response]);
            image.src = window.URL.createObjectURL(blob);
        };

        imageXmlHTTP.onerror = (error: Event) => {
            console.error(new Error(`Failed to fetch sprite sheet (${sprite}${format}.png)`));
        };

        imageXmlHTTP.send();

        let jsonXmlHTTP: XMLHttpRequest = new XMLHttpRequest();
        jsonXmlHTTP.open("GET", sprite + format + ".json", true);
        jsonXmlHTTP.responseType = "text";
        jsonXmlHTTP.onload = () => {
            let json: ISprites = <ISprites>JSON.parse(jsonXmlHTTP.response);

            this._spriteAtlasOperation$.next(
                (atlas: SpriteAtlas): SpriteAtlas => {
                    atlas.json = json;

                    return atlas;
                });
        };

        jsonXmlHTTP.onerror = (error: Event) => {
            console.error(new Error(`Failed to fetch sheet (${sprite}${format}.json)`));
        };

        jsonXmlHTTP.send();
    }

    public get spriteAtlas$(): Observable<ISpriteAtlas> {
        return this._spriteAtlas$;
    }

    public dispose(): void {
        this._atlasSubscription.unsubscribe();
    }
}

export default SpriteService;
