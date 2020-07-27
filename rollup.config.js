import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'zone-card.js',
  output: {
    file: 'dist/zone-card.js',
    format: 'umd',
  },
  plugins: [nodeResolve()],
};
