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
		let carret = ''
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
		super(source, message, token.position, token.contents.length)

		Object.setPrototypeOf(this, TokenParseError.prototype)
	}
}

/** @private */
enum State {
	Newline,
	Name,
	Props,
	PropName,
	PropValue,
	Content,
	MultilineComment
}

/** @private */
enum TokenType {
	NewLine,
	Indent,
	Comment,
	MultilineCommentStart,
	MultilineCommentEnd,
	AttributeName,
	Name,
	InstantClass,
	InstantId,
	Value,
	Content,
	StringLimiter,
	StringContents
}

/** @private */
const TokenTypes = [
	TokenType.NewLine,
	TokenType.Indent,
	TokenType.Comment,
	TokenType.MultilineCommentStart,
	TokenType.MultilineCommentEnd,
	TokenType.AttributeName,
	TokenType.Name,
	TokenType.InstantClass,
	TokenType.InstantId,
	TokenType.Value,
	TokenType.StringLimiter,
	TokenType.Content
]

/** @private */
const Tokens = {
	[TokenType.NewLine]: /^(\n)/i,
	[TokenType.Indent]: /^([ \t])/i,
	[TokenType.Comment]: /^(\/\/[^\n]*)/i,
	[TokenType.MultilineCommentStart]: /^(\/\*)/i,
	[TokenType.MultilineCommentEnd]: /^(\*\/)/i,
	[TokenType.AttributeName]: /^([a-z0-9-:@]*\s*=\s*)/i,
	[TokenType.Name]: /^([a-z]+)/i,
	[TokenType.InstantClass]: /^(\.[a-z][a-z0-9_-]*)/i,
	[TokenType.InstantId]: /^(#[a-z][a-z0-9_-]*)/i,
	[TokenType.Value]: /^([a-z0-9-_\\#:@]+)/i,
	[TokenType.StringLimiter]: /^(")/i,
	[TokenType.StringContents]: /^((?:\\"|[^"])*)/i,
	[TokenType.Content]: /^((?:\\\n|[^\n])+)/i
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

	private previousState: State

	private indent: number = 0

	constructor (
		private text: string
	) {}

	public compile () {
		let indentType: string

		let top = this.currentElement = this.createElement(-1, null)

		this.indent = 0
		this.attributeName = ''

		while (this.position < this.text.length) {
			let token = this.consumeAny()

			if (!token) {
				throw new ParseError(this, 'Unknown input encountered', this.position)
			}

			switch (this.state) {
				case State.Newline:
					if (token.type === TokenType.Comment) {
						// Nothing, skip
					} else if (token.type === TokenType.MultilineCommentStart) {
						this.previousState = this.state
						this.state = State.MultilineComment
					} else if (token.type === TokenType.Indent) {
						if (indentType && indentType !== token.contents) {
							throw new TokenParseError(
								this,
								'Inconsistent use of tabs and spaces for indentation',
								token
							)
						}

						indentType = token.contents
						this.indent++
					} else if (token.type !== TokenType.NewLine) {
						let parent = null

						if (this.indent > this.currentElement.indent) {
							parent = this.currentElement
						}

						if (this.indent <= this.currentElement.indent) {
							let match = this.currentElement
							while (match.indent >= this.indent) {
								match = match.parent
								if (!match) {
									throw new TokenParseError(
										this,
										`Element has unknown indentation ${ this.indent }`,
										token
									)
								}
							}
							parent = match
						}

						let element = this.createElement(this.indent, parent)
						parent.children.push(element)
						this.currentElement = element

						this.state = State.Name
						this.processProps(token)
					} else {
						this.indent = 0
					}
					break

				case State.Name:
				case State.Props:
					this.processProps(token)
					break

				case State.PropValue:
					switch (token.type) {
						case TokenType.Indent: break
						case TokenType.Comment: break
						case TokenType.MultilineCommentStart:
							this.previousState = this.state
							this.state = State.MultilineComment
							break
						case TokenType.StringLimiter:
							this.currentElement.attributes[this.attributeName] = '"' + this.consumeString() + '"'
							this.state = State.Props
							break
						case TokenType.Name:
						case TokenType.Value:
						case TokenType.InstantClass:
						case TokenType.InstantId:
							this.currentElement.attributes[this.attributeName] = token.contents
							this.state = State.Props
							break
					}
					break

				case State.Content:
					switch (token.type) {
						case TokenType.NewLine:
							this.indent = 0
							this.state = State.Newline
							break
						case TokenType.Comment: break
						case TokenType.MultilineCommentStart:
							this.previousState = this.state
							this.state = State.MultilineComment
							break
						default:
							this.currentElement.content += token.contents
					}
					break

				case State.MultilineComment:
					switch (token.type) {
						case TokenType.MultilineCommentEnd:
							this.state = this.previousState
							break
					}
			}
		}

		return top
	}

	public getCode (offset: number) {
		let from = (this.text.substr(0, offset).lastIndexOf('\n') + 1) || 0
		let to = this.text.indexOf('\n', offset)
		if (to < 0) to = this.text.length

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
		switch (token.type) {
			case TokenType.Indent: break
			case TokenType.Comment: break
			case TokenType.MultilineCommentStart:
				this.previousState = this.state
				this.state = State.MultilineComment
				break
			case TokenType.Name:
				if (this.state !== State.Name) {
					this.state = State.Content

					this.currentElement.content = token.contents
				} else {
					this.currentElement.name = token.contents
					this.state = State.Props
				}
				break
			case TokenType.InstantClass:
				this.currentElement.classes.push(token.contents.substr(1))
				this.state = State.Props
				break
			case TokenType.InstantId:
				this.currentElement.id = token.contents.substr(1)
				this.state = State.Props
				break
			case TokenType.AttributeName:
				let name = token.contents.match(/^([a-z0-9-:@]+)/i)
				if (!name) {
					throw new TokenParseError(this, 'Attribute name was not matched', token)
				}

				this.attributeName = name[1]
				this.state = State.PropValue
				break
			case TokenType.StringLimiter:
				this.currentElement.content = this.consumeString()
				this.state = State.Newline
				break
			case TokenType.NewLine:
				this.indent = 0
				this.state = State.Newline
				break
			default:
				throw new TokenParseError(this, `Unexpected ${ TokenType[token.type] }`, token)
		}
	}

	private consumeString () {
		let contents = this.consumeSpecific(TokenType.StringContents)
		if (!contents) {
			throw new ParseError(this, 'Expected string contents', this.position)
		}

		let end = this.consumeSpecific(TokenType.StringLimiter)
		if (!end) {
			throw new ParseError(this, 'Expected end of string', this.position)
		}

		return contents.contents
	}

	private createElement (indent: number, parent: VirtualElement | null) {
		let element = new VirtualElement()
		element.indent = indent
		element.parent = parent
		return element
	}

	private consumeAny () {
		for (let i = 0; i < TokenTypes.length; i++) {
			let type = TokenTypes[i]
			let token = this.consumeSpecific(type)
			if (token && (token.type !== TokenType.StringContents || token.contents.length > 0)) {
				return token
			}
		}
		return null
	}

	private consumeSpecific (name: TokenType) {
		let token = this.consume(name)
		if (token) {
			/*
			console.log(
				`[${ State[this.state] }] Consumed ${ TokenType[name] } - '${token.contents.replace(/\n/g, '\\n')}'`
			)
			*/

			this.position += token.contents.length
			return token
		}

		return null
	}

	private consume (token: TokenType) {
		let regex = Tokens[token]
		let match = regex.exec(this.text.substr(this.position))

		if (!match) return null

		return new Token(match[1], this.position, token)
	}
}

export class Token {
	constructor (
		public contents: string,
		public position: number,
		public type: TokenType
	) {}
}
