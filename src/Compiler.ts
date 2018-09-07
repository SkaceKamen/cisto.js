import { VirtualElement } from './VirtualElement'
import { Parser } from './Parser'

export abstract class Compiler {
	constructor (
		protected data: { [key: string]: any } = {}
	) {}

	abstract compile (element: VirtualElement)

	load (template: string) {
		return this.compile(new Parser().parse(template))
	}

	protected resolve (name: string) {
		if (name.substr(0, 1) === '"') {
			return JSON.parse(name)
		}
		return this.data[name]
	}
}
