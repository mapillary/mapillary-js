import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import virtual from '@rollup/plugin-virtual';
import { virtualModules, resolveOptions } from './rollup.options.config';

export default [
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
];
