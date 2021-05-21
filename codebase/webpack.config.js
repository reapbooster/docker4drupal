const path = require('path');

module.exports = {
  entry: {
    index: './src/index.jsx',
    ReactDisplay: './web/themes/custom/custom_bootstrap_barrio/js/ReactDisplay.entry.jsx',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // JS to Style-Nodes
          "style-loader",
          // CSS => CommonJS
          "css-loader", 
          // SASS => CSS
          "sass-loader",
        ]
      }
    ],
  },
  resolve: { extensions: ['*', '.js', '.jsx'] },
  output: {
    path: path.resolve(__dirname, './web/themes/custom/custom_bootstrap_barrio/js/'),
    filename: '[name].entry.js',
    sourceMapFilename: '[name].js.map'
  },
};