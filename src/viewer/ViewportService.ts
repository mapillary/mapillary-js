import {
    RenderService,
    TextureRenderer,
} from "../Render";
import {StateService} from "../State";

export class ViewportService {
    private _renderService: RenderService;
    private _stateService: StateService;
    private _textureRenderer: TextureRenderer;

    constructor (
        renderSerive: RenderService,
        stateService: StateService,
        textureRenderer: TextureRenderer) {

        this._renderService = renderSerive;
        this._stateService = stateService;
        this._textureRenderer = textureRenderer;
    }
}

export default ViewportService;
