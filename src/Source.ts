import { VirtualElement } from './VirtualElement'

/**
 * Error thrown when there is parsing problem with source.
 */
export class ParseError extends Error {
	constructor (
		public source: Source,
		message: string,
		public position: number,
		public length = 1
	) {
		super(message)

		Object.setPrototypeOf(this, ParseError.prototype)
	}

	/**
	 * @return line on which error occured
	 */
	public getLine () {
		return this.source.getLocation(this.position).line
	}

	/**
	 * Returns part of template where error occured and its location.
	 * @return formatted description of error
	 */
	public toPrettyString () {
		let location = this.source.getLocation(this.position)
		let code = this.source.getCode(this.position).replace(/\t/g, ' ')
		let indent = ''
		let carret = '  '
		let codeLine = `${location.line} | `

		for (let i = 0; i < codeLine.length + location.offset - 1; i++) {
			indent += ' '
		}
		for (let c = 0; c < this.length; c++) {
			carret += '^'
		}

		return [
			`Parse error at ${location.line}:${location.offset}`,
			codeLine + code,
			indent + carret,
			indent + ' ' + this.message,
			''
		].join('\n')
	}

	public toString () {
		return this.toPrettyString()
	}
}

/** @private */
export class TokenParseError extends ParseError {
	constructor (public source: Source, message: string, token: Token) {
		super(source, message, token.getPosition(), token.getContents().length)

		Object.setPrototypeOf(this, TokenParseError.prototype)
	}
}

/** @private */
enum State {
	Newline = 'newline',
	Name = 'name',
	Props = 'props',
	PropName = 'propname',
	PropValue = 'propvalue',
	Content = 'content'
}

/** @private */
const Tokens = {
	newLine: '\\n',
	indent: '[ \\t]',
	attributeName: '[a-z0-9-:@]*\\s*=\\s*',
	name: '[a-z]+',
	instantClass: '\\.[a-z][a-z0-9_-]*',
	instantId: '#[a-z][a-z0-9_-]*',
	value: '[a-z0-9-_/\\\\#:@]+',
	stringLimiter: '"',
	stringContents: '(\\\\"|[^"])*'
}

/**
 * Represent single parsed template and actually does all the parsing.
 * @private
 */
export class Source {
	/** @var position our current position in the text */
	private position: number = 0
	/** @var state determines what tokens are accepted and what to do with them */
	private state: State = State.Newline
	/** @var currentElement element we're parsing for now */
	private currentElement: VirtualElement = this.createElement(-1, null)
	/** @var attributeName buffer variable used to save attribute name when parsing attribute */
	private attributeName: string = ''

	constructor (
		private text: string,
		private debug = false
	) {}

	public compile () {
		let indent: number = 0

		let top = this.currentElement = this.createElement(-1, null)
		this.attributeName = ''

		while (this.position < this.text.length) {
			let token = this.consumeAny()

			if (!token) {
				throw new ParseError(this, 'Unknown input encountered', this.position)
			}

			switch (this.state) {
				case State.Newline:
					if (token.is('indent')) {
						indent++
					} else if (!token.is('newLine')) {
						let parent = null

						if (indent > this.currentElement.indent) {
							parent = this.currentElement
						}

						if (indent <= this.currentElement.indent) {
							let match = this.currentElement
							while (match.indent >= indent) {
								match = match.parent
								if (!match) {
									throw new TokenParseError(
										this,
										`Element has unknown indentation ${ indent }`,
										token
									)
								}
							}
							parent = match
						}

						let element = this.createElement(indent, parent)
						parent.children.push(element)
						this.currentElement = element

						indent = 0
						this.state = State.Name
						this.processProps(token)
					}
					break

				case State.Name:
				case State.Props:
					this.processProps(token)
					break

				case State.PropValue:
					switch (token.getType()) {
						case 'indent': break
						case 'stringLimiter':
							this.currentElement.attributes[this.attributeName] = '"' + this.consumeString() + '"'
							this.state = State.Props
							break
						case 'name':
						case 'value':
						case 'instantClass':
						case 'instantId':
							this.currentElement.attributes[this.attributeName] = token.getContents()
							this.state = State.Props
							break
					}
			}
		}

		return top
	}

	public getCode (offset: number) {
		let from = this.text.substr(0, offset).lastIndexOf('\n') + 1 || 0
		let to = this.text.indexOf('\n', offset) || this.text.length

		return this.text.substr(from, to - from)
	}

	public getLocation (offset: number) {
		let line = this.text.substr(0, offset).split('\n').length
		let off = offset - (this.text.substr(0, offset).lastIndexOf('\n') || 0)
		return {
			line,
			offset: off
		}
	}

	private processProps (token: Token) {
		switch (token.getType()) {
			case 'indent': break
			case 'name':
				if (this.state !== State.Name) {
					this.state = State.Content

					this.currentElement.content = token.getContents()
					while (true) {
						let subToken = this.consumeAny()
						if (subToken === null) break
						if (subToken.is('newLine')) break
						this.currentElement.content += subToken.getContents()
					}

					this.state = State.Newline
				} else {
					this.currentElement.name = token.getContents()
					this.state = State.Props
				}
				break
			case 'instantClass':
				this.currentElement.classes.push(token.getContents().substr(1))
				this.state = State.Props
				break
			case 'instantId':
				this.currentElement.id = token.getContents().substr(1)
				this.state = State.Props
				break
			case 'attributeName':
				let name = token.getContents().match(/^([a-z0-9-:@]+)/i)
				if (!name) {
					throw new TokenParseError(this, 'Attribute name was not matched', token)
				}

				this.attributeName = name[1]
				this.state = State.PropValue
				break
			case 'stringLimiter':
				this.currentElement.content = this.consumeString()
				this.state = State.Newline
				break
			case 'newLine':
				this.state = State.Newline
				break
			default:
				throw new TokenParseError(this, `Unexpected ${ token.getType() }`, token)
		}
	}

	private consumeString () {
		let contents = this.consumeSpecific('stringContents')
		if (!contents) {
			throw new ParseError(this, 'Expected string contents', this.position)
		}

		let end = this.consumeSpecific('stringLimiter')
		if (!end) {
			throw new ParseError(this, 'Expected end of string', this.position)
		}

		return contents.getContents()
	}

	private createElement (indent: number, parent: VirtualElement | null) {
		let element = new VirtualElement()
		element.indent = indent
		element.parent = parent
		return element
	}

	private consumeAny () {
		for (let name in Tokens) {
			let token = this.consumeSpecific(name)
			if (token) {
				return token
			}
		}
		return null
	}

	private consumeSpecific (name: string) {
		let token = this.consume(Tokens[name], name)
		if (token) {
			this.d(
				`[${ this.state }] Consumed ${ name } - '${token.getContents().replace(/\n/g, '\\n')}'`
			)

			this.position += token.getContents().length
			return token
		}

		return null
	}

	private consume (pattern: string, token: string) {
		let match = this.text
			.substr(this.position)
			.match(new RegExp(`^(${ pattern })`, 'i'))

		if (!match) return null

		return new Token(match[1], this.position, token)
	}

	private d (text: string) {
		if (this.debug) console.log(text)
	}
}

export class Token {
	constructor (
		private contents: string,
		private position: number,
		private type: string
	) {}

	is (type: string) {
		return this.type === type
	}

	getType () {
		return this.type
	}

	getContents () {
		return this.contents
	}

	getPosition () {
		return this.position
	}
}
