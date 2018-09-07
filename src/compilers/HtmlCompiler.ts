import { Compiler } from '../compiler'
import { VirtualElement } from '../VirtualElement'

export class HtmlCompiler implements Compiler {
	compile (element: VirtualElement) {
		return this.outElement(element)
	}

	private outElement (element: VirtualElement) {
		let type = element.name || 'div'
		let html = `<${type}`
		if (element.id) {
			html += ` id="${element.id}"`
		}
		if (element.classes.length) {
			html += ` class="${element.classes.join(' ').replace(/"/g, '')}"`
		}
		for (let att in element.attributes) {
			html += ` ${att}="${element.attributes[att].replace(/"/g, '')}"`
		}
		html += '>'

		if (element.content) {
			html += '\n'
			html += '  ' + element.content
			html += '\n'
		}

		element.children.forEach(child => {
			html += '\n'
			html += '  ' + this.outElement(child).replace(/\n(.)/g, '\n  $1')
		})

		html += `</${type}>\n`

		return html
	}
}
