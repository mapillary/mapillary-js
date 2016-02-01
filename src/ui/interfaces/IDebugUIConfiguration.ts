import {IUIConfiguration, UIState} from "../../UI";

import * as rx from "rx";

export interface IDebugUIConfiguration extends IUIConfiguration {
    uiState$: rx.Observable<UIState>;
}

export default IDebugUIConfiguration;
