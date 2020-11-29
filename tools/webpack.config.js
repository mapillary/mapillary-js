/* eslint-env node */
const { join } = require('path');
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer");
// const CopyPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const MAPILLARY_ENV = process.env.MAPILLARY_ENV || 'production';
// const shouldMinify = !!process.env.MAPILLARY_MINIFY;
const shouldMinify = false;
const shouldReportSize = process.env.MAPILLARY_SIZE_REPORT === "true";

if (["development", "production"].indexOf(MAPILLARY_ENV) < 0) {
    throw new Error("unknown MAPILLARY_ENV ", MAPILLARY_ENV);
}

const isDevMode = MAPILLARY_ENV === "development";

const plugins = [
    new webpack.DefinePlugin({
        __DEV__: isDevMode,
        __LOGGER_LEVEL__: isDevMode ? "\"INFO\"" : "\"DEBUG\"",
        "process.env": {
            NODE_ENV: JSON.stringify(isDevMode ? "development" : "production"),
        },
    }),
    // new CopyPlugin([
    //     {
    //         from: './styles/*.svg',
    //         to: './',
    //         flatten: true,
    //     },
    // ]),
    // helps to find which packages are using deprecated API
    new webpack.DefinePlugin({
        'process.traceDeprecation': true,
    }),
    // new MiniCssExtractPlugin({
    //     // Options similar to the same options in webpackOptions.output
    //     // both options are optional
    //     filename: isDevMode ? '.[name].css' : '[name].[hash:6].css',
    //     chunkFilename: isDevMode ? '[id].css' : '[id].[hash:6].css',
    //     // ignoreOrder: false, // Enable to remove warnings about conflicting order
    // }),

]

if (shouldReportSize) {
    plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
    // mode: isDevMode ? "development" : "production",
    mode:  "development",
    // devtool: 'source-map',
    // target: 'web',
    context: join(__dirname, '../'),
    // module: isDevMode ? "development" : "production",
    entry:  "./src/exports.ts",
    output: {
        library: 'Mapillary',
        libraryTarget: "umd",
        libraryExport: 'default',
        path: join(__dirname, '../dist-webpack/'),
        filename: shouldMinify ? "[name]-js.min.js" : "[name].js",
    },
    optimization: {
        sideEffects: false,
        minimizer: shouldMinify ? [new UglifyJsPlugin()] : [
            new UglifyJsPlugin({
                uglifyOptions: {
                    compress: {
                        keep_infinity: true,
                        inline: false,
                        reduce_funcs: false,
                    },
                    keep_fnames: true,
                    keep_classnames:true,
                    keep_fargs: true,
                    mangle: false,
                    output: {
                        beautify: true,
                        comments: true,
                    },
                },
            }),
        ],
    },
    performance: {
        maxEntrypointSize: shouldMinify ? 400000 : 1700000,
        maxAssetSize: shouldMinify ? 400000 : 1700000,
    },
    resolve: {
        extensions: [".ts", ".json"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            cacheDirectory: true,
                            presets: [
                                ["@babel/env", { loose: true, modules: false } ],
                            ],
                        },
                    },
                    { loader: "ts-loader" },
                ],
            },
            // {
            //     test: /\.css$/,
            //     use: [
            //         {
            //           loader: MiniCssExtractPlugin.loader,
            //           options: {
            //             hmr: isDevMode,
            //           },
            //         },
            //         'css-loader',
            //         {
            //             loader: 'postcss-loader',
            //             options: {
            //                 sourceMap: true,
            //                 config: {
            //                    path: join(__dirname, './postcss.config.js'),
            //                 },
            //               },
            //         }
            //       ]
            // },

        ],
    },
    plugins,
    node: {
        console: false,
        global: true,
        Buffer: false,
        __filname: false,
        __dirname: false,
        setImmediate: false,
        // fs: "empty", // This is to account for what appears to be a bug: https://github.com/josephsavona/valuable/issues/9`
        // process: false,
    },
    watchOptions: {
        ignored: /node_modules/,
    }
}
