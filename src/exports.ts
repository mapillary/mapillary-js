// ugly but working webpack workaround to be able to import the library in
// CommonJS mode.
// TODO investigate
/* tslint:disable no-var-requires */
// module.exports = require("./Mapillary.ts").default;
/* tslint:enable no-var-requires */
import * as Mapillary from './Mapillary';

export default Mapillary;
