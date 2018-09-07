import { Source } from './Source'
import { VirtualElement } from './VirtualElement'

export { ParseError } from './Source'
export { VirtualElement } from './VirtualElement'

export class Parser {
	parse (text: string): VirtualElement {
		return new Source(text).compile()
	}
}
