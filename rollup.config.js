import commonjs from '@rollup/plugin-commonjs';
import dts from "rollup-plugin-dts";
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import virtual from '@rollup/plugin-virtual';
import { terser } from "rollup-plugin-terser";

const virtualModules = {
    './getXMLHttpRequest': `
    export default function getXMLHttpRequest() {
        return new XmlHTTPRequest();
    }`,
    'domain': 'export default undefined;',
};

const resolveOptions = { preferBuiltins: false };

export default [
    {
        input: 'build/esm/src/Mapillary.js',
        output: [
            {
                file: 'dist/mapillary.module.js',
                format: 'es',
                sourcemap: true,
            }],
        plugins: [
            virtual(virtualModules),
            resolve(resolveOptions),
            commonjs(),
        ],
    },
    {
        input: 'build/esm/src/Mapillary.js',
        output: [
            {
                file: 'dist/mapillary.js',
                format: 'umd',
                name: 'Mapillary',
                sourcemap: true,
            }
        ],
        plugins: [
            sourcemaps(),
            virtual(virtualModules),
            resolve(resolveOptions),
            commonjs(),
        ],
    },
    {
        input: 'build/esm/src/Mapillary.js',
        output: [
            {
                file: 'dist/mapillary.min.js',
                format: 'umd',
                name: 'Mapillary',
                sourcemap: true,
            }
        ],
        plugins: [
            sourcemaps(),
            virtual(virtualModules),
            resolve(resolveOptions),
            commonjs(),
            terser(),
        ],
    },
    {
        input: 'build/esm/src/Mapillary.d.ts',
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
