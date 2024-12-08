import clear from 'rollup-plugin-clear';
// import screeps from 'rollup-plugin-screeps';
import screeps from './rollup-plugin-screeps'; // 修改过的版本, 解决了上传wasm文件有重复后缀的问题
import copy from 'rollup-plugin-copy';
import fs from 'fs';
import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import { fileURLToPath } from 'url';
import typescript from 'rollup-plugin-typescript2';
// import terser from '@rollup/plugin-terser'; // 压缩代码

const isProduction = process.env.DEST === 'main';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secret = JSON.parse(fs.readFileSync('./.secret.json', 'utf-8'));
const config = secret[process.env.DEST];

// 根据指定的目标获取对应的配置项
if (!process.env.DEST) console.log("未指定目标, 代码将被编译但不会上传")
else if (!config) { throw new Error("无效目标，请检查 secret.json 中是否包含对应配置") }

const runCopy = () => {
    return copy({
        targets: [
            {
                src: 'dist/main.js',
                dest: config.copyPath
            },
            {
                src: 'src/planner/dynamic/algo_wasm_priorityqueue.wasm',
                dest: config.copyPath
            },
            {
                src: 'src/planner/dynamic/autoPlanner63.js',
                dest: config.copyPath
            },
            {
                src: 'dist/main.js.map',
                dest: config.copyPath,
                rename: name => name + '.map.js',
                transform: contents => `module.exports = ${contents.toString()};`
            }
        ],
        hook: 'writeBundle',
        verbose: true
    })
}

// 根据指定的配置决定是上传还是复制到文件夹
const pluginDeploy = 
        config && config.copyPath ?
        // 复制到指定路径
        runCopy() : 
        config && config.token ?
        // 上传到screeps
        screeps({ config, dayRun: !config }) :
        '';

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/main.js',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [
        // 清除上次编译成果
        clear({ targets: ["dist"] }),
        // 打包依赖
        resolve(),
        // 模块化依赖
        commonjs(),
        // ts编译
        typescript({ tsconfig: './tsconfig.json' }),
        // 转换js到指定版本
        babel({
            babelHelpers: 'bundled',
            extensions: ['.js'],
        }),
        // 路径别名
        alias({
            entries: [{
                find: '@',
                replacement: path.resolve(__dirname, 'src')
            }]
        }),
        copy({
            targets: [
                {
                    src: 'src/planner/dynamic/autoPlanner63.js',
                    dest: 'dist'
                },
                {
                    src: 'src/planner/dynamic/algo_wasm_priorityqueue.wasm',
                    dest: 'dist'
                },
            ]
        }),
        // 执行上传或者复制
        pluginDeploy
    ],
    external: ['src/planner/dynamic/algo_wasm_priorityqueue.wasm']
};