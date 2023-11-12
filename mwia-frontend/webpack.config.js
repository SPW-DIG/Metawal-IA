const HtmlWebPackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

var path = require('path');

const APP_NAME = 'mwia-frontend';

// this will create index.html file containing script
// source in dist folder dynamically
const htmlPlugin = new HtmlWebPackPlugin({
    template: './src/index.html',
    filename: './index.html',
    inject: 'body',
    chunks: [APP_NAME],
});

const dev = true;

var styleLoader = 'style-loader';
var cssLoader =  'css-loader';


module.exports = {
    // this can be overridden by command line `--mode=production`
    mode: dev ? 'development' : 'production',
    //optimization: { minimize: !dev },

    //specify the entry point for your project
    entry: { [APP_NAME] : [ './src/index.tsx' ] },
    // specify the output file name
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app/index.js',
        //publicPath: '/',
        libraryTarget: 'umd',
        umdNamedDefine: true

    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            "url": false,
            "stream": require.resolve("stream-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            stream: require.resolve('readable-stream'),
        }
    },
    target: 'web',
    devtool: 'source-map',
    module: {
        // consists the transform configuration
        rules: [
            { // required since import of monaco-language-turtle, cf https://stackoverflow.com/questions/69427025/programmatic-webpack-jest-esm-cant-resolve-module-without-js-file-exten
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, cssLoader]
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader, cssLoader, 'sass-loader']
            },
           // { test: /\.json$/, loader: "json-loader" },

            // with webpack 5, use 'asset/resource' to properly bundle resources like fonts or images
            // cf https://github.com/microsoft/monaco-editor/tree/main/webpack-plugin
            { // required for font-awesome
                test: /\.(jpe?g|ttf|png|gif|svg|ico|woff(2)?|eot)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource'
                /*
                loader: "file-loader",
                options: {
                    outputPath: 'assets/',
                    name: '[name].[ext]'
                }

                 */
            },
            {
                test: /\.ttl/,
                type: 'asset/source'
            }
        ]
    },
    // this will create a development server to host our application
    // and will also provide live reload functionality
    devServer: {
        host: '0.0.0.0',
        static: './dist',
        //contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 8010,
        // needed to properly support BrowsrRouter
        // see https://stackoverflow.com/questions/43209666/react-router-v4-cannot-get-url
        historyApiFallback: true,
        //https: true,
    },

    // this will watch the bundle for any changes
    //watch: true,
    // specify the plugins which you are using
    plugins: [
        htmlPlugin,
        new CopyWebpackPlugin({
            patterns:[
            { from: 'static' }
        ]}),
        // Extract CSS into separate files
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),

        // required to properly bundle all the monaco assets
        new MonacoWebpackPlugin()

        // this is already activated with production mode
        //new webpack.optimize.ModuleConcatenationPlugin()
    ]
};
