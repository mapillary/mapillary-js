import fs from "fs";
import { join } from "path";

export const pathname = (dirname) => {
  const url = join(import.meta.url, `../${dirname}`);
  return new URL(url).pathname;
};

const accessToken = process.env.ACCESS_TOKEN;
const files = [
  {
    name: "token.js",
    content: `export const accessToken = '${accessToken}';`,
  },
  {
    name: "token.umd.js",
    content: `var accessToken = '${accessToken}';`,
  },
];

const dirname = pathname("../doc/.access-token");
if (!fs.existsSync(dirname)) {
  fs.mkdirSync(dirname);
}

for (const { name, content } of files) {
  fs.writeFileSync(join(dirname, name), content);
}
