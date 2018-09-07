export class VirtualElement {
	/** number of indents before this element */
	indent: number = 0
	/** parent element */
	parent: VirtualElement = null

	/** element name (usually tag name in html) */
	name: string | null = null
	/** element id */
	id: string | null = null
	/** element inner contents (excluding children) */
	content: string | null = null
	/** element child elements */
	children: VirtualElement[] = []
	/**
	 * Element attributes, the attribute content can be
	 * either string, which will be provided as `"value"`, or
	 * just simply value, which will be provided without `"`
	 */
	attributes: { [key: string]: string } = {}
	/** element classes */
	classes: string[] = []
}
