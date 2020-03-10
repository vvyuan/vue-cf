import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import vue from 'rollup-plugin-vue2';
import less from 'rollup-plugin-less';
import fs from 'fs';

const cssTarget = 'index.css';
// 删除已创建的css文件
if(fs.existsSync(cssTarget)) {
  fs.unlinkSync(cssTarget);
}
export default {
  input: 'src/index.ts',
  // input: 'src/components/CFCommonForm.vue',
  output: {
    file: 'index.js',
    sourcemap: true,
    format: 'cjs',
  },
  plugins: [
    // typescript({exclude: ['.vue']}),
    vue(),
    less({
      output: function (css) {
        // 写入index.css
        fs.appendFileSync(cssTarget, css, 'utf-8');
        return ''
      }
    }),
    typescript(),
    resolve({ extensions: ['.js', '.ts', '.vue']}), // so Rollup can find `ms`
    commonjs({ extensions: ['.js', '.ts'], exclude: ['.vue', '.css']}), // so Rollup can convert `ms` to an ES module
  ],
  // 指出应将哪些模块视为外部模块
  external: [
    'vue',
    'vue-router',
    'ant-design-vue',
    'moment',
    'uuid',
    'md5',
  ]
};
