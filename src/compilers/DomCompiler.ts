import { Compiler } from '../compiler'
import { VirtualElement } from '../VirtualElement'

export class DomCompiler implements Compiler {
	compile (element: VirtualElement) {
		return this.outElement(element)
	}

	protected resolve (name: string) {
		if (name.substr(0, 1) === '"') {
			return JSON.parse(name)
		}
	}

	private outElement (element: VirtualElement) {
		let type = element.name || 'div'
		let dom: HTMLElement = document.createElement(type)

		if (element.id) {
			dom.setAttribute('id', this.resolve(element.id))
		}

		element.classes.forEach(name => {
			dom.className += ' ' + this.resolve(name)
		})

		for (let att in element.attributes) {
			dom.setAttribute(att, this.resolve(element.attributes[att]))
		}

		if (element.content) {
			dom.innerHTML = element.content
		}

		element.children.forEach(child => {
			dom.appendChild(this.outElement(child))
		})

		return dom
	}
}
