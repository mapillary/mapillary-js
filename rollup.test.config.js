import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import virtual from '@rollup/plugin-virtual';

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
        input: 'build/esm/spec/Unit.spec.js',
        output: [
            {
                file: 'build/spec/Unit.spec.js',
                format: 'cjs',
                name: 'Unit',
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
