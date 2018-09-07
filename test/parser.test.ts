import { Parser, VirtualElement } from '../dist/cisto'

describe('Parser test', () => {
	it('Parses single element', () => {
		let result = new Parser().parse('#container')

		expect(result).toBeInstanceOf(VirtualElement)
		expect(result.children.length).toBe(1)
		expect(result.children[0].id).toBe('container')
		expect(result.children[0].name).toBe(null)
		expect(result.children[0].classes.length).toBe(0)
	})

	it('Parses attributes', () => {
		let result = new Parser().parse('img.logo#logo src="logo.png" alt=logo')

		expect(result).toBeInstanceOf(VirtualElement)
		expect(result.children.length).toBe(1)
		expect(result.children[0].id).toBe('logo')
		expect(result.children[0].name).toBe('img')
		expect(result.children[0].classes.length).toBe(1)
		expect(result.children[0].classes[0]).toBe('logo')
		expect(result.children[0].attributes.alt).toBe('logo')
		expect(result.children[0].attributes.src).toBe('"logo.png"')
	})

	it('Parses children', () => {
		let result = new Parser().parse(`
		.items
			.item
			.item
			.item
		`)

		expect(result).toBeInstanceOf(VirtualElement)
		expect(result.children.length).toBe(1)
		expect(result.children[0].children.length).toBe(3)
	})

	it('Parses children after more children', () => {
		let result = new Parser().parse(`
		.items
			.item
			div.item
			.item-2
		.items
			.item-1
			.item
		`)

		expect(result).toBeInstanceOf(VirtualElement)
		expect(result.children.length).toBe(2)
		expect(result.children[0].children.length).toBe(3)
		expect(result.children[1].children.length).toBe(2)
	})
})
