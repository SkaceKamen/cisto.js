import { VirtualElement } from './VirtualElement'
import { Parser } from './Parser'

/** @private */
export abstract class Compiler {
	constructor (
		protected data: { [key: string]: any } = {}
	) {}

	abstract compile (element: VirtualElement)

	/**
	 * Parses and compiles template string.
	 * @param template template string
	 */
	process (template: string) {
		return this.compile(new Parser().parse(template))
	}

	/**
	 * Tries to resolve specified value
	 * @param name
	 * @return parsed result
	 */
	protected resolve (name: string) {
		if (name.substr(0, 1) === '"') {
			return JSON.parse(name)
		}
		return this.data[name] === undefined ? name : this.data[name]
	}
}
