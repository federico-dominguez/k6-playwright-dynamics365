const path = require('path');
const { readdirSync, statSync } = require('fs');

// Recursively find all test files
function getTestEntries(dir, entries = {}) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      getTestEntries(fullPath, entries);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      const relativePath = path.relative(path.join(__dirname, 'src'), fullPath);
      const entryName = relativePath.replace(/\.ts$/, '');
      entries[entryName] = fullPath;
    }
  });
  
  return entries;
}

module.exports = {
  mode: 'production',
  entry: getTestEntries(path.join(__dirname, 'src')),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@tests': path.resolve(__dirname, 'src/tests'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  target: 'web',
  externals: /^(k6|https?:\/\/)(\/.*)?/,
  stats: {
    colors: true,
    warnings: true,
    errors: true,
  },
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
};
