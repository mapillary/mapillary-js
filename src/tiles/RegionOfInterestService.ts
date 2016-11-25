import {Transform} from "../Geo";
import {RenderService} from "../Render";
import {TextureProvider} from "../Tiles";

export class RegionOfInterestService {
    private _renderService: RenderService;
    private _textureProvider: TextureProvider;
    private _transform: Transform;

    constructor (
        transform: Transform,
        renderSerive: RenderService,
        textureProvider: TextureProvider) {

        this._renderService = renderSerive;
        this._textureProvider = textureProvider;
        this._transform = transform;
    }
}

export default RegionOfInterestService;
