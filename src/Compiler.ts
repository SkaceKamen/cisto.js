import { VirtualElement } from './source'

export interface Compiler {
	compile (element: VirtualElement)
}
