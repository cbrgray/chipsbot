const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node', // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    entry: './src/bot.ts',
    devtool: 'cheap-source-map', // inline-source-map
    mode: 'production',
    module: {
        rules: [
            { test: /\.ts$/, use: { loader: 'ts-loader' }, exclude: /node_modules/ }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './out'),
    },
};
