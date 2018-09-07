import { VirtualElement } from './VirtualElement'

export interface Compiler {
	compile (element: VirtualElement)
}
