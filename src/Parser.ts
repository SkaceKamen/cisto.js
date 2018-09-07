import { Source } from './Source'
import { VirtualElement } from './VirtualElement'

export { ParseError } from './Source'
export { VirtualElement } from './VirtualElement'

export class Parser {
	/**
	 * Parses specified template into virtual element.
	 * @param text template
	 * @throws ParserError error when parsing the template
	 * @returns virtual element
	 */
	parse (text: string): VirtualElement {
		return new Source(text).compile()
	}
}
