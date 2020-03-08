import auto from '@rollup/plugin-auto-install';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sucrase from '@rollup/plugin-sucrase';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    // format: 'cjs'
  },
  plugins: [
    auto(),
    resolve({ extensions: ['.js', '.ts']}), // so Rollup can find `ms`
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript']
    }),
    commonjs({ extensions: ['.js', '.ts']}) // so Rollup can convert `ms` to an ES module
  ],
  // 指出应将哪些模块视为外部模块
  external: ['vue', 'ant-design-vue']
};
