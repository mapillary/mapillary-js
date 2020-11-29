const { join } = require('path');
const webpack = require('webpack');
// const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const extractCSS = new ExtractTextPlugin('bundle.min.css')

module.exports = {
  mode: "production",
  devtool: "source-amp",
  context: join(__dirname, "../"),
  entry:  "./styles/main.css",
  output: {
      filename: 'mapillary-webpack.min.css',
  },
  module: {
    rules: [{
        test: /\.css$/,
        use: [
            'css-loader',
            {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true,
                    config: {
                        path: join(__dirname, './postcss.config.js'),
                    },
                },
            }
        ]
      },
    ]
  },
  resolve: {
    alias: {},
    modules: [],
    extensions: ['.css']
  },
};
