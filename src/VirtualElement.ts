export class VirtualElement {
	indent: number = 0
	parent: VirtualElement = null

	name: string | null = null
	id: string | null = null
	content: string | null = null
	children: VirtualElement[] = []
	attributes: { [key: string]: string } = {}
	classes: string[] = []
}
