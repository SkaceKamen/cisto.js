import { Compiler } from '../compiler'
import { VirtualElement } from '../VirtualElement'

export class SerializeCompiler extends Compiler {
	compile (element: VirtualElement) {
		return this.outElement(element)
	}

	private outElement (element: VirtualElement) {
		return {
			name: element.name,
			id: element.id,
			attributes: element.attributes,
			classes: element.classes,
			content: element.content,
			children: element.children.map(child => this.outElement(child))
		}
	}
}
