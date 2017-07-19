const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');

// Phaser webpack config
const phaserModule = path.join(__dirname, '/node_modules/phaser-ce/');
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js');
const pixi = path.join(phaserModule, 'build/custom/pixi.js');
const p2 = path.join(phaserModule, 'build/custom/p2.js');

const definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'false'))
});

// sw-precache-webpack-plugin 插件配置
const SW_CACHEID = pkg.name;
const SW_FILENAME = `${SW_CACHEID}-service-worker.js`;
const SW_FILEPATH = path.resolve(__dirname, SW_FILENAME);
const SW_IGNORE_PATTERNS = [/dist\/.*\.html/];
const SW_PRECACHE_CONFIG = {
  minify: true,
  cacheId: SW_CACHEID,
  filename: SW_FILENAME,
  filepath: SW_FILEPATH,
  staticFileGlobs: [
    './',
    './index.html',
    './favicon.ico',
    './manifest.json',
    './assets/images/**/*.{png,jpg,gif,svg}',
    './assets/sounds/**/*.{mp3,ogg,wav}',
  ],
  stripPrefix: './',
  mergeStaticsConfig: true,
  runtimeCaching: [{
    urlPattern: /assets\/fonts\/.*$/,
    handler: 'cacheFirst'
  }, {
    urlPattern: /assets\/icons\/.*$/,
    handler: 'cacheFirst'
  }],
  staticFileGlobsIgnorePatterns: SW_IGNORE_PATTERNS,
};

module.exports = {
  entry: {
    app: [
      'babel-polyfill',
      path.resolve(__dirname, 'src/main.js')
    ],
    vendor: ['pixi', 'p2', 'phaser', 'webfontloader', 'lodash', 'hammerjs']

  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './dist/',
    filename: 'bundle.js'
  },
  plugins: [
    definePlugin,
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.optimize.UglifyJsPlugin({
      drop_console: true,
      minimize: true,
      output: {
        comments: false
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({ name: 'vendor'/* chunkName= */, filename: 'vendor.bundle.js'/* filename= */}),
    new SWPrecacheWebpackPlugin(SW_PRECACHE_CONFIG),
  ],
  module: {
    rules: [
      { test: /\.js$/, use: ['babel-loader'], include: path.join(__dirname, 'src') },
      { test: /pixi\.js/, use: ['expose-loader?PIXI'] },
      { test: /phaser-split\.js$/, use: ['expose-loader?Phaser'] },
      { test: /p2\.js/, use: ['expose-loader?p2'] }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      'phaser': phaser,
      'pixi': pixi,
      'p2': p2
    }
  }
}