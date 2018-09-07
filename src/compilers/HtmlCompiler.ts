import { Compiler } from '../compiler'
import { VirtualElement } from '../VirtualElement'

const childless = {
	img: true
}

export class HtmlCompiler implements Compiler {
	constructor (
		private data: { [key: string]: any }
	) {}

	compile (element: VirtualElement) {
		return element.children
			.map(e => this.outElement(e))
			.join('\n')
	}

	protected resolve (name: string) {
		if (name.substr(0, 1) === '"') {
			return JSON.parse(name)
		}
		return this.data[name]
	}

	private outElement (element: VirtualElement) {
		let type = element.name || 'div'
		let html = `<${type}`
		if (element.id) {
			html += ` id="${element.id}"`
		}
		if (element.classes.length) {
			html += ` class="${element.classes.join(' ')}"`
		}
		for (let att in element.attributes) {
			html += ` ${att}="${this.resolve(element.attributes[att])}"`
		}

		if (childless[type]) {
			html += ' />\n'

			if (element.children.length) {
				throw new Error(`Element type ${type} can't have children.`)
			}
		} else {
			html += '>'

			if (element.content) {
				html += '\n'
				html += '  ' + element.content.replace(/{([^}]*)}/g, (match, p1) => { return this.data[p1] })
				html += '\n'
			}

			element.children.forEach(child => {
				html += '\n'
				html += '  ' + this.outElement(child).replace(/\n(.)/g, '\n  $1')
			})

			html += `</${type}>\n`
		}

		return html
	}
}
