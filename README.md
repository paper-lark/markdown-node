# Markdown Parser

Basic markdown parser module for Node.js.

## Usage

Main exported function is `parser`. It has the following signature:

```typescript
function parser(markup: string): string;
```

where `markup` is a Markdown to be parsed.

Return value is an HTML markup converted from Markdown.

### Example

```javascript
const parser = require('./lib/parser');

const data =
  '# Header\n' +
  'Here is some text.\n' +
  'This is the second sentence.\n' +
  '\n' +
  'This is the second paragraph.';
const output = parser(data);

console.log(output);
```

## Bugs

If you find any bug, please report it at https://github.com/paper-lark/markdown-node/issues.

## License

Markdown Parser is available under the terms of the MIT License. See `LICENSE` for more.
