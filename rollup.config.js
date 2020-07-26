import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'zone-card.js',
  output: {
    file: 'dist/zone-card.js',
    format: 'umd',
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: 'node_modules/node-vibrant/**',
      dynamicRequireTargets: ['node_modules/node-vibrant/lib/*.js'],
    }),
  ],
};
