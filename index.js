const parser = require('./lib/parser');

const data =
  'This is a paragraph.\n' +
  '> Wise men say\n' +
  '> \n' +
  '> Only fools rush in...\n' +
  'This is the end!\n';
const output = parser(data);

console.log(output);
