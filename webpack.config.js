const webpack = require('webpack')
const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
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
            {
                /**
                 * Transpile libraries which are not ES5 to ES5
                 *
                 * This step is necessary for legacy devices such as Arris STB.
                 */
                test: /\.(js|mjs)$/,
                include: /node_modules\/(enum-for|deepcopy)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
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
    target: ['web', 'es5'],
}
