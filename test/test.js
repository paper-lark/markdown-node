const parser = require('../lib/parser');

test('basic functionality', () => {
  const data =
    '# Header\n' +
    'Here is some text.\n' +
    'This is the second sentence.\n' +
    '\n' +
    'This is the second paragraph.';
  const result =
    '<h1>Header</h1>' +
    '<p>Here is some text. This is the second sentence.</p>' +
    '<p>This is the second paragraph.</p>';
  expect(parser(data)).toEqual(result);
});

test('unordered list support', () => {
  const data =
    '# Header\n' +
    'Here is some text\n' +
    '- This is the first point\n' +
    '- This is the second point\n' +
    '- This is the third point\n' +
    '\n' +
    '- This is the first point\n' +
    '- This is the second point\n' +
    '- This is the third point';
  const result =
    '<h1>Header</h1>' +
    '<p>Here is some text</p>' +
    '<ul>' +
    '<li>This is the first point</li>' +
    '<li>This is the second point</li>' +
    '<li>This is the third point</li>' +
    '</ul>' +
    '<ul>' +
    '<li>This is the first point</li>' +
    '<li>This is the second point</li>' +
    '<li>This is the third point</li>' +
    '</ul>';
  expect(parser(data)).toEqual(result);
});

test('header support', () => {
  const data =
    '# This is the first level header\n' +
    '## This is the second level header\n' +
    'This is some text\n' +
    '### This is the third level header\n' +
    '####### This is the 6th level header despite the number of hashes\n' +
    '###';
  const result =
    '<h1>This is the first level header</h1>' +
    '<h2>This is the second level header</h2>' +
    '<p>This is some text</p>' +
    '<h3>This is the third level header</h3>' +
    '<h6>This is the 6th level header despite the number of hashes</h6>' +
    '<h3></h3>';
  expect(parser(data)).toEqual(result);
});

test('line separator', () => {
  const data =
    '# Header\n' +
    'Here is some text\n' +
    '___\n' +
    'This is the second paragraph\n' +
    '---\n' +
    'This is the third paragraph';
  const result =
    '<h1>Header</h1>' +
    '<p>Here is some text</p>' +
    '<hr>' +
    '<p>This is the second paragraph</p>' +
    '<hr>' +
    '<p>This is the third paragraph</p>';
  expect(parser(data)).toEqual(result);
});

test('basic inline tags', () => {
  const data =
    'This is *italic*.\n' +
    'This is also _italic_.\n' +
    'This is **bold**.\n' +
    'And this is __bold__.\n' +
    'And __this__ is __bold__.\n';
  const result =
    '<p>This is <i>italic</i>. ' +
    'This is also <i>italic</i>. ' +
    'This is <b>bold</b>. ' +
    'And this is <b>bold</b>. ' +
    'And <b>this</b> is <b>bold</b>.</p>';
  expect(parser(data)).toEqual(result);
});

test('complex inline tags', () => {
  const data =
    'This line contains *combined __style__*.\n' +
    'This line contains *combined **style***.\n' +
    'This line contains _combined __style___.\n' +
    'This line contains ___combined__ style_.\n' +
    'This line contains ***combined** style*.\n' +
    'This is another line with ___combined_ style__.\n' +
    'This is another line with ***combined* style**.\n' +
    'And here are the last **two *tests***.\n' +
    'And here are the last __two _tests___.\n';
  const result =
    '<p>This line contains <i>combined <b>style</b></i>. ' +
    'This line contains <i>combined <b>style</b></i>. ' +
    'This line contains <i>combined <b>style</b></i>. ' +
    'This line contains <i><b>combined</b> style</i>. ' +
    'This line contains <i><b>combined</b> style</i>. ' +
    'This is another line with <b><i>combined</i> style</b>. ' +
    'This is another line with <b><i>combined</i> style</b>. ' +
    'And here are the last <b>two <i>tests</i></b>. ' +
    'And here are the last <b>two <i>tests</i></b>.</p>';
  expect(parser(data)).toEqual(result);
});

test('escaped tags', () => {
  const data =
    'Hello \\*world\\*.\n' +
    'Sun shining right \\__above you_\\_...\n' +
    'Saying \\_I love you\\_ has nothing to do with meaning it.\n' +
    "Lately I've been **losing \\*sleep**.\n";
  const result =
    '<p>Hello \\*world\\*. ' +
    'Sun shining right \\_<i>above you</i>\\_... ' +
    'Saying \\_I love you\\_ has nothing to do with meaning it. ' +
    "Lately I've been <b>losing \\*sleep</b>.</p>";
  expect(parser(data)).toEqual(result);
});

test('links', () => {
  const data =
    'This is a link: https://www.google.com\n' +
    'http://www.example.com/some-url\n' +
    'https://www.facebook.com/ - Facebook\n' +
    '[Github](https://github.com/)\n' +
    'This is an inline link with a [name](https://duckduckgo.com/).\n' +
    "I came across Google's [Code Prettifier](https://github.com/google/code-prettify).";
  const result =
    '<p>This is a link: <a href="https://www.google.com">https://www.google.com</a> ' +
    '<a href="http://www.example.com/some-url">http://www.example.com/some-url</a> ' +
    '<a href="https://www.facebook.com/">https://www.facebook.com/</a> - Facebook ' +
    '<a href="https://github.com/">Github</a> ' +
    'This is an inline link with a <a href="https://duckduckgo.com/">name</a>. ' +
    'I came across Google\'s <a href="https://github.com/google/code-prettify">Code Prettifier</a>.</p>';
  expect(parser(data)).toEqual(result);
});

test('code blocks', () => {
  const data =
    'This is a block of code:\n' +
    '``` javascript \n' +
    'let i = 10;\n' +
    'while (i > 0) {\n' +
    '  console.log(i);\n' +
    '  i--;\n' +
    '}\n' +
    '```\n' +
    '\n' +
    'This is another block:\n' +
    '\n' +
    '```\n' +
    'let i = 10;\n' +
    'for (let i = 0; i < 10; i++) {\n' +
    '  console.log(i);\n' +
    '}\n' +
    '```\n';
  const result = /<p>This is a block of code:<\/p><pre>[^]*<\/pre><p>This is another block:<\/p><pre>[^]*<\/pre>/;
  expect(parser(data)).toMatch(result);
});

test('images', () => {
  const data =
    '![Picture #1](http://lorempixel.com/400/200)\n' +
    '\n' +
    'This is another picture ![Picture #2](http://lorempixel.com/600/300)';
  const result =
    '<p><img src="http://lorempixel.com/400/200" alt="Picture #1"></p>' +
    '<p>This is another picture <img src="http://lorempixel.com/600/300" alt="Picture #2"></p>';
  expect(parser(data)).toEqual(result);
});

test('blockquotes', () => {
  const data =
    'This is a paragraph.\n' +
    '> Wise men say\n' +
    '> only fools rush in\n' +
    '> \n' +
    "> But I can't help\n" +
    '> falling in love with you...\n' +
    'This is the end!\n';
  const result =
    '<p>This is a paragraph.</p>' +
    '<blockquote>Wise men say only fools rush in<br>' +
    "But I can't help falling in love with you...</blockquote>" +
    '<p>This is the end!</p>';
  expect(parser(data)).toEqual(result);
});
