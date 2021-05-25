import fs from "fs";
import { join } from "path";

export const pathname = (dirname) => {
  const url = join(import.meta.url, `../${dirname}`);
  return new URL(url).pathname;
};

const mapillaryAccessToken = process.env.MAPILLARY_ACCESS_TOKEN;
const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;

const esmContent = `
export const accessToken = '${mapillaryAccessToken}';
export const mapboxAccessToken = '${mapboxAccessToken}';
`;
const umdContent = `
var accessToken = '${mapillaryAccessToken}';
var mapboxAccessToken = '${mapboxAccessToken}';
`;

const files = [
  {
    name: "token.js",
    content: esmContent,
  },
  {
    name: "token.umd.js",
    content: umdContent,
  },
];

const dirname = pathname("../doc/.access-token");
if (!fs.existsSync(dirname)) {
  fs.mkdirSync(dirname);
}

for (const { name, content } of files) {
  fs.writeFileSync(join(dirname, name), content);
}
