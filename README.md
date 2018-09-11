# cisto.js

Small template library with simple integration.

## Installation

```sh
npm i cisto
```

## Changelog

### [1.0.5] - 2018-09-11
 - Added support for code in attribute values (`{ code }`)
 - Element names can now contain numbers, underscores and dashes
 - Content in quotes can now be inserted anywhere in the element definition

Only last changes listed, more at [CHANELOG.md](CHANGELOG.md).

## Usage

```typescript
import { Parser, DomCompiler, HtmlCompiler } from 'cisto'

// Parses template and returns virtual elements
let virtualElement = new Parser().parse('div.title')

// Transcribes the virtual element to html text
let html: string = new HtmlCompiler().compile(virtualElement)
// Transcribes the virtual element to actual DOM structure
let dom: HTMLElement = new DomCompiler().compile(virtualElement)

// Or you can directly call compiler, without having to worry about parser
let object = new SerializeCompiler().process('div.title')
```

## Example
```
#container
  #header
    a href="index"
      img.logo src="logo.png" alt="Logo"

    #navigation
      a href="index" Home
      a href="about_us" About us
  #content
  #footer
```

can transpile to HTML:

```html
<div id="container">
  <div id="header">
    <a href="index">
      <img class="logo" src="logo.png" alt="Logo" />
    </a>
    <div id="navigation">
      <a href="index">Home</a>
      <a href="about_us">About us</a>
    </div>
  </div>
  <div id="content"></div>
  <div id="footer"></div>
</div>
```

or really anything else, you can do whatever you want with, the parser output looks like this:

```json
{ "name": null,
  "id": null,
  "attributes": {},
  "classes": [],
  "content": null,
  "children":
   [ { "name": null,
       "id": "container",
       "attributes": {},
       "classes": [],
       "content": null,
       "children": [...] } ] }
```

there are prepared compilers for Html and DOM, but nothing stops you from writing your own compiler.