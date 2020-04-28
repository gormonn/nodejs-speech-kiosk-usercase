// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
const webpack = require('webpack')
const path = require('path');

module.exports = {
  entry: './src/example.js',
  output: {
    library: 'Speech',
		libraryTarget: "umd",
    filename: './index.js',
  },
  node: {
    child_process: 'empty',
    fs: 'empty',
    crypto: 'empty',
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  optimization: {
		// We no not want to minimize our code.
		minimize: false
	},
  module: {
    rules: [
      {
        test: /node_modules[\\/]@grpc[\\/]grpc-js/,
        use: 'null-loader',
      },
      {
        test: /node_modules[\\/]grpc/,
        use: 'null-loader',
      },
      {
        test: /node_modules[\\/]retry-request/,
        use: 'null-loader',
      },
      {
        test: /node_modules[\\/]https?-proxy-agent/,
        use: 'null-loader',
      },
      {
        test: /node_modules[\\/]gtoken/,
        use: 'null-loader',
      },
    ],
  },
  mode: 'production',
  
  // devtool: 'eval',
  // plugins: [
  //   new webpack.SourceMapDevToolPlugin({
  //     filename: 'index.js.map'
  //   })
  // ]
};