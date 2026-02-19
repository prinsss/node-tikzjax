import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeExternals } from 'rollup-plugin-node-externals';
import { RollupOptions } from 'rollup';

const options: RollupOptions[] = [
  // Node.js ESM & Browser ESM
  {
    input: ['src/node.ts', 'src/browser.ts'],
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: false,
      preserveModules: true,
      entryFileNames: '[name].js',
    },
    plugins: [nodeExternals(), commonjs(), typescript()],
  },

  // Node.js CJS
  {
    input: 'src/node.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: false,
      exports: 'named',
      preserveModules: true,
      entryFileNames: '[name].cjs',
    },
    plugins: [nodeExternals(), commonjs(), typescript()],
  },
];

export default options;
