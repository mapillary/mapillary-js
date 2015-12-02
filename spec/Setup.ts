import * as fs from "fs";
import * as nodePath from "path";

import {VCR} from "../src/VCR";

if (process.env.VCR === 'playback') {
    VCR.setCache(JSON.parse(fs.readFileSync(nodePath.join(__dirname, "../vcr/vcr.json"), "utf8")));
}
