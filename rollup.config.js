import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/ZoneCard.js',
  output: {
    file: 'dist/zone-card-bundle.js',
    format: 'cjs',
  },
  plugins: [nodeResolve()],
};
