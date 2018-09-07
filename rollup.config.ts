import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'

const pkg = require('./package.json')

export default {
	input: 'src/cisto.ts',
	output: [
		{ file: pkg.main, name: 'cisto', format: 'umd', sourcemap: true },
		{ file: pkg.module, format: 'es', sourcemap: true }
	],
	plugins: [
		typescript({ useTsconfigDeclarationDir: true }),
		commonjs(),
		resolve(),
		sourceMaps()
	]
}
