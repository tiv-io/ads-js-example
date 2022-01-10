const webpack = require('webpack')
const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const dotenv = require('dotenv')
const { version } = require('./package.json')

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    devtool: 'source-map',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
        ],
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js' ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        port: 3000,
    },
    plugins: [
        new webpack.DefinePlugin({}),
        new HtmlWebPackPlugin({
            template: path.resolve(__dirname, './src/index.html'),
            filename: path.resolve(__dirname, './dist/index.html'),
            favicon: null,// path.resolve(__dirname, './src/public/icon.ico'),
            minify: false,
            inject: 'head',
        }),
    ],
}
