import { Compiler } from '../compiler'
import { VirtualElement } from '../VirtualElement'

/** @var childless hash table to determine if element is singleton */
const childless = {
	area: true,
	br: true,
	base: true,
	col: true,
	command: true,
	embed: true,
	hr: true,
	img: true,
	input: true,
	keygen: true,
	link: true,
	meta: true,
	param: true,
	track: true,
	wbr: true
}

/**
 * Transpiles virtual element to HTML string.
 */
export class HtmlCompiler extends Compiler {
	compile (element: VirtualElement) {
		return element.children
			.map(e => this.outElement(e))
			.join('\n')
	}

	/**
	 * Transpires element and its children.
	 * @param element
	 * @return html code
	 */
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

		if (childless[type.toLowerCase()]) {
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
