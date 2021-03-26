import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import {
    esm,
    srcInput as input,
    plugins,
    umdOutput,
} from './config/rollup.js';

const unminifiedOutput = Object.assign(
    { file: 'dist/mapillary.unminified.js' },
    umdOutput);

const minifiedOutput = Object.assign(
    { file: 'dist/mapillary.js' },
    umdOutput);

const bundles = [
    esm,
    {
        input,
        output: [
            unminifiedOutput
        ],
        plugins,
    },
    {
        input,
        output: [
            minifiedOutput,
        ],
        plugins: [
            ...plugins,
            terser(),
        ],
    },
    {
        input: 'build/esm/src/mapillary.d.ts',
        output: [
            {
                file: 'dist/mapillary.d.ts',
                format: 'es',
            }
        ],
        plugins: [
            dts(),
        ],
    },
];

export default bundles;
