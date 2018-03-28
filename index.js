const parser = require('./lib/parser');

const data =
  '# Header\n' +
  'Here is some text.\n' +
  'This is the second sentence.\n' +
  '\n' +
  'This is the second paragraph.';
const output = parser(data);

console.log(output);
