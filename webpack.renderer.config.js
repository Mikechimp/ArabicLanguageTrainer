const rules = [
  // No node-loader or asset-relocator-loader here.
  // The renderer runs sandboxed (no Node.js) so native .node
  // modules can't be loaded and __dirname doesn't exist.
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/,
    type: 'asset/resource',
  },
];

module.exports = {
  // 'web' target is required because the renderer runs with sandbox: true
  // (no Node.js APIs). The default 'electron-renderer' target generates
  // code that calls require(), which doesn't exist in a sandboxed renderer.
  target: 'web',
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
