import { Compiler } from '../compiler'
import { VirtualElement } from '../VirtualElement'

export class DomCompiler implements Compiler {
	constructor (
		private data: { [key: string]: any }
	) {}

	compile (element: VirtualElement) {
		return this.outElement(element)
	}

	protected resolve (name: string) {
		if (name.substr(0, 1) === '"') {
			return JSON.parse(name)
		}
		return this.data[name]
	}

	private outElement (element: VirtualElement) {
		let type = element.name || 'div'
		let dom: HTMLElement = document.createElement(type)

		if (element.id) {
			dom.setAttribute('id', this.resolve(element.id))
		}

		dom.className = element.classes.join(' ')

		for (let att in element.attributes) {
			dom.setAttribute(att, this.resolve(element.attributes[att]))
		}

		if (element.content) {
			dom.innerHTML = element.content.replace(/{([^}]*)}/g, (match, p1) => { return this.data[p1] })
		}

		element.children.forEach(child => {
			dom.appendChild(this.outElement(child))
		})

		return dom
	}
}
