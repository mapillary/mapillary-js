import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import virtual from '@rollup/plugin-virtual';
import { terser } from 'rollup-plugin-terser';
import { virtualModules, resolveOptions } from './rollup.options.config';
import umd from './rollup.umd.config';

const bundles = [
    {
        input: 'build/esm/src/Mapillary.js',
        output: [
            {
                file: 'dist/mapillary.module.js',
                format: 'es',
                sourcemap: true,
            }],
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

bundles.push(...umd);

export default bundles;
