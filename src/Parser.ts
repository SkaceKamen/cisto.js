import { Source, ParseError, VirtualElement } from './Source'
export { VirtualElement, ParseError } from './Source'

export class Parser {
	parse (text: string): VirtualElement {
		return new Source(text).compile()
	}
}
