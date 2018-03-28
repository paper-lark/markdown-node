const Prism = require('prismjs');

/**
 * Inline tag.
 */
interface ITag {
  token: string;
  tag: string;
}

/**
 * CSS Class structure
 */
interface ICSSClass {
  [tag: string]: [string];
}

/**
 * Parser mode.
 */
enum Mode {
  Idle = '',
  Plain = 'p',
  List = 'ul',
  Code = 'pre',
  Blockquote = 'blockquote'
}

/**
 * Replace basic inline token with a corresponding tag.
 *
 * @param {string} markup Markup text.
 * @param {ITag} pair Pair of tag and token to replace.
 * @returns {string} Markup with substituted tokens.
 */
function substituteBasicToken(markup: string, pair: ITag): string {
  let i = 0;
  const tokenLength = pair.token.length;
  const tagLength = pair.tag.length;
  let isOpening = true;
  while (i < markup.length) {
    if (
      markup.charAt(i - 1) !== '\\' &&
      markup.substr(i, tokenLength) === pair.token
    ) {
      /* Unescaped token found */
      const prefix = markup.slice(0, i);
      const postfix = markup.slice(i + tokenLength);
      if (isOpening) {
        /* Add an opening tag */
        markup = prefix + '<' + pair.tag + '>' + postfix;
        i += tagLength + 2;
        isOpening = false;
      } else {
        /* Add a closing tag */
        markup = prefix + '</' + pair.tag + '>' + postfix;
        i += tagLength + 3;
        isOpening = true;
      }
    } else {
      /* Proceed to the next character */
      i++;
    }
  }

  /* Signal is a closing tag was not found */
  if (!isOpening) {
    throw new Error('no closing token found');
  }

  return markup;
}

/**
 * Replace complex inline token with a corresponding tag.
 *
 * @param {string} markup Markup text.
 * @param {ITag} pair Pair of tag and token to replace.
 * @returns {string} Markup with substituted tokens.
 */
function substituteComplexTokens(markup: string, pair: ITag) {
  let i = 0;
  let isOpening = true;
  let start: number = 0;
  let end: number = 0;
  let tokensInside: number = 0;
  const tokenLength = pair.token.length;
  const tagLength = pair.tag.length;
  while (i < markup.length) {
    if (
      markup.charAt(i - 1) !== '\\' &&
      (isOpening || markup.substr(i + 1, tokenLength) !== pair.token) &&
      markup.substr(i, tokenLength) === pair.token
    ) {
      if (isOpening) {
        /* Opening tag */
        start = i;
        tokensInside = 0;
        isOpening = false;
        i += tokenLength;
      } else {
        /* Closing tag */
        end = i;
        isOpening = true;
        if (tokensInside % 2 === 1) {
          /* Adjust token position */
          if (markup.substr(start + 1, tokenLength) === pair.token) {
            start++;
          } else if (markup.substr(end - 1, tokenLength) === pair.token) {
            end--;
          } else {
            throw new Error('uneven number of tokens found');
          }
        }
        /* Replace tokens with markup */
        const prefix = markup.slice(0, start);
        const infix = markup.slice(start + tokenLength, end); // ERROR
        const postfix = markup.slice(end + tokenLength);
        markup =
          prefix +
          '<' +
          pair.tag +
          '>' +
          infix +
          '</' +
          pair.tag +
          '>' +
          postfix;
        i += 2 * tagLength + 5;
      }
    } else {
      if (
        !isOpening &&
        markup.charAt(i - 1) !== '\\' &&
        markup.charAt(i) === pair.token.charAt(0)
      ) {
        tokensInside++;
      }
      i++;
    }
  }

  /* Signal is a closing tag was not found */
  if (!isOpening) {
    throw new Error('no closing token found');
  }

  return markup;
}

/**
 * Process inline tokens in the text.
 *
 * @param {string} markup Markup text.
 * @returns {string} Markup with substituted inline tags.
 */
function processInlineTokens(markup: string): string {
  let result = markup;
  const complex: ReadonlyArray<ITag> = [
    { tag: 'b', token: '**' },
    { tag: 'b', token: '__' },
    { tag: 'del', token: '~~' }
  ];
  const basic: ReadonlyArray<ITag> = [
    { tag: 'code', token: '`' },
    { tag: 'i', token: '*' },
    { tag: 'i', token: '_' }
  ];

  for (const pair of complex) {
    result = substituteComplexTokens(result, pair);
  }

  for (const pair of basic) {
    result = substituteBasicToken(result, pair);
  }

  /* Parse images */
  const image = /!\[([^]*)\]\(([^\s]*)\)/gi;
  result = result.replace(image, (match: string, ...args: any[]) => {
    return '<img src="' + args[1] + '" alt="' + args[0] + '">';
  });

  /* Parse links */
  const link = /(\s|^)(https?:\/\/[^\s]+)(\s|$)/gi;
  const complexLink = /\[([^]*)\]\(([^\s]*)\)/gi;
  result = result.replace(link, (match: string, ...args: any[]) => {
    return args[0] + '<a href="' + args[1] + '">' + args[1] + '</a>' + args[2];
  });
  result = result.replace(complexLink, (match: string, ...args: any[]) => {
    return '<a href="' + args[1] + '">' + args[0] + '</a>';
  });
  return result;
}

/**
 * Returns tags to append to switch the mode.
 * If new mode is not equal to the current one,
 * returns tags to switch the mode.
 * Otherwise, returns an empty string.
 *
 * @param {Mode} current Current mode
 * @param {Mode} mode New mode
 * @returns {string} Tag to append
 */
function completeMode(current: Mode, mode: Mode): string {
  if (current !== mode) {
    const first = current !== Mode.Idle ? '</' + current + '>' : '';
    const second = mode !== Mode.Idle ? '<' + mode + '>' : '';
    return first + second;
  } else {
    return '';
  }
}

/**
 * Analyzes header depth.
 *
 * @param {string} line Line to analyze
 * @returns {number} Header depth
 */
function headerDepth(line: string): number {
  let depth = 0;
  for (; depth < line.length && line[depth] === '#'; depth++) {}
  return depth;
}

/**
 * Main function.
 * Parses markup passed and converts it to HTML.
 *
 * @param {string} markup Markup text.
 * @returns {string} - HTML text.
 */
function parser(markup: string): string {
  const lines: string[] = markup.split('\n');
  let result: string = ''; // result
  let mode: Mode = Mode.Idle; // current parser mode
  let isPreviousBreak = false; // used in blockquote to signal that a previous string was a line break
  let lang: string = 'javascript';

  lines.forEach(line => {
    /* Check if the line is a start of the code block */
    if (line.substr(0, 3) === '```') {
      /* Code block switch */
      if (mode !== Mode.Code) {
        lang = line.substr(3).trim();
        lang = line.length > 3 && lang !== '' ? lang : 'javascript';
        result += completeMode(mode, Mode.Code);
        mode = Mode.Code;
        return;
      } else {
        result += completeMode(mode, Mode.Idle);
        mode = Mode.Idle;
        return;
      }
    }

    /* Preprocess line and process empty line */
    if (mode !== Mode.Code) {
      line = line.trim(); // TODO: list depth!
      if (line === '---' || line === '___') {
        /* Line separator */
        result += completeMode(mode, Mode.Idle) + '<hr>';
        mode = Mode.Idle;
        return;
      } else if (line === '') {
        /* Empty line */
        result += completeMode(mode, Mode.Idle);
        mode = Mode.Idle;
        return;
      }
      line = processInlineTokens(line);
    }

    /* Chain depending on the first character */
    if (mode === Mode.Code) {
      /* Code inside a code block */
      result += Prism.highlight(line, Prism.languages[lang], lang) + '\n';
    } else if (line.charAt(0) === '#') {
      /* Header */
      let depth = headerDepth(line);
      line = line.substr(depth).trim();
      depth = Math.min(depth, 6);
      result +=
        completeMode(mode, Mode.Idle) +
        '<h' +
        depth +
        '>' +
        line +
        '</h' +
        depth +
        '>';
      mode = Mode.Idle;
    } else if (line.charAt(0) === '-') {
      /* List */
      result +=
        completeMode(mode, Mode.List) +
        '<li>' +
        line.substr(1).trim() +
        '</li>';
      mode = Mode.List;
    } else if (line.charAt(0) === '>') {
      /* Blockquote */
      line = line.substr(1).trim();
      result +=
        completeMode(mode, Mode.Blockquote) +
        (mode === Mode.Blockquote && !isPreviousBreak && line !== ''
          ? ' '
          : '') +
        (line !== '' ? line : '<br>');
      isPreviousBreak = line === '';
      mode = Mode.Blockquote;
    } else {
      /* Plain text */
      result +=
        completeMode(mode, Mode.Plain) +
        (mode === Mode.Plain ? ' ' : '') +
        line;
      mode = Mode.Plain;
    }
  });

  /* Append closing tag if necessary */
  result += completeMode(mode, Mode.Idle);

  return result;
}

module.exports = parser;
