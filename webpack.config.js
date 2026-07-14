const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',  // or 'production'
  entry: './src/index.js',  // Main entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',  // Ensures correct paths when serving the app
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      process: require.resolve('process/browser'),  // Polyfill for process
      http: require.resolve('stream-http'),  // Polyfill for http
      https: require.resolve('https-browserify'),  // Polyfill for https
      path: require.resolve('path-browserify'),  // Polyfill for path
      os: require.resolve('os-browserify/browser'),  // Polyfill for os
      url: require.resolve('url'),  // Polyfill for url
      fs: false,  // Disable fs module (it's not available in browsers)
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,  // JavaScript and JSX files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],  // React and ES6+ support
          },
        },
      },
      {
        test: /\.css$/,  // CSS files
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',  // HTML template
    }),
	new webpack.DefinePlugin({
      'process.env.NODE_ENV': "development",
      // ...
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser', // Polyfill process
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    port: 3000,  // Local development server will run on port 3000
    historyApiFallback: true,  // For React Router (single-page apps)
  },
};
