/* ============================================================
   Colour-literal parser + WCAG helpers for the brand-colour migration audit.
   Shared by scripts/colour-inventory.mjs and scripts/validate-palette.mjs so the
   inventory and the gate can never disagree about what counts as a colour.

   Recognises: 3/4/6/8-digit HEX (including %23-encoded HEX inside data: URIs),
   rgb/rgba/hsl/hsla functions in legacy comma and modern space/slash syntax,
   CSS named colours inside colour-bearing declarations / SVG paint attributes /
   JS style assignments, and RGB/RGBA integer tuples in Python icon scripts.
   HTML numeric entities (&#8599;) and URL fragments (#B54-cosmetics) are not colours.
   ============================================================ */

export const NAMED_COLOURS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black
blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue
cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue
darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow
grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon
lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink
lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose
moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
whitesmoke yellow yellowgreen`.split(/\s+/).filter(Boolean));

export const SYSTEM_COLOURS = new Set(['canvas', 'canvastext', 'linktext', 'visitedtext', 'activetext',
  'buttonface', 'buttontext', 'buttonborder', 'field', 'fieldtext', 'highlight', 'highlighttext',
  'selecteditem', 'selecteditemtext', 'mark', 'marktext', 'graytext', 'accentcolor', 'accentcolortext']);

const round3 = (n) => Math.round(n * 1000) / 1000;
const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));

export function hexOf({ r, g, b }) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function keyOf(c) {
  return `${c.r},${c.g},${c.b}`;
}
export function normalised(c) {
  return c.a === 1 ? hexOf(c) : 'rgba' + '(' + [c.r, c.g, c.b, c.a].join(',') + ')';
}

function parseHex(h) {
  let s = h.toLowerCase();
  if (s.length === 3 || s.length === 4) s = s.split('').map((ch) => ch + ch).join('');
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  const a = s.length === 8 ? round3(parseInt(s.slice(6, 8), 16) / 255) : 1;
  return { r, g, b, a };
}

function num(tok, pctScale) {
  if (/^[-+]?(\d+\.?\d*|\.\d+)%$/.test(tok)) return (parseFloat(tok) / 100) * pctScale;
  if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(tok)) return parseFloat(tok);
  return NaN;
}

function hslChannels(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: clamp255(f(0) * 255), g: clamp255(f(8) * 255), b: clamp255(f(4) * 255) };
}

function parseFunc(fn, args) {
  const toks = args.replace(/\//g, ' , ').split(/[\s,]+/).filter(Boolean);
  if (toks.length < 3 || toks.length > 4) return null;
  const lower = fn.toLowerCase();
  const alphaTok = toks[3];
  const a = alphaTok === undefined ? 1 : num(alphaTok, 1);
  if (Number.isNaN(a)) return null;
  if (lower.startsWith('rgb')) {
    const [r, g, b] = toks.slice(0, 3).map((t) => num(t, 255));
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: round3(Math.max(0, Math.min(1, a))) };
  }
  const h = parseFloat(toks[0]);
  const s = num(toks[1], 1);
  const l = num(toks[2], 1);
  if ([h, s, l].some(Number.isNaN)) return null;
  return { ...hslChannels(h, s, l), a: round3(Math.max(0, Math.min(1, a))) };
}

/* ---------- CSS context tracking (selector stack), comment-aware ---------- */
function cssSelectorIndex(text, start, end) {
  const events = []; // [offset, selector]
  const stack = [];
  let prelude = '';
  let i = start;
  while (i < end) {
    const ch = text[i];
    if (ch === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2);
      i = close === -1 ? end : close + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const close = text.indexOf(ch, i + 1);
      const stop = close === -1 ? end : close + 1;
      prelude += text.slice(i, stop);
      i = stop;
      continue;
    }
    if (ch === '{') {
      stack.push(prelude.replace(/\s+/g, ' ').trim());
      events.push([i, stack[stack.length - 1]]);
      prelude = '';
    } else if (ch === '}') {
      stack.pop();
      events.push([i, stack.length ? stack[stack.length - 1] : '']);
      prelude = '';
    } else if (ch === ';') {
      prelude = '';
    } else {
      prelude += ch;
    }
    i++;
  }
  return events;
}

function selectorAt(events, offset) {
  let lo = 0;
  let hi = events.length - 1;
  let best = '';
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid][0] < offset) {
      best = events[mid][1];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return best;
}

function inComment(text, offset, ranges) {
  return ranges.some(([a, b]) => offset >= a && offset < b);
}

function commentRanges(text, ext) {
  const out = [];
  const add = (re) => {
    for (const m of text.matchAll(re)) out.push([m.index, m.index + m[0].length]);
  };
  add(/\/\*[\s\S]*?\*\//g);
  if (ext === '.html' || ext === '.svg') add(/<!--[\s\S]*?-->/g);
  if (ext === '.js' || ext === '.mjs' || ext === '.html') add(/(^|[^:"'\\])\/\/[^\n]*/g);
  if (ext === '.py') add(/#[^\n]*/g);
  return out;
}

const COLOUR_PROPS = '(?:color|background-color|background-image|background|border(?:-(?:top|right|bottom|left|block|inline))?(?:-color)?|outline(?:-color)?|fill|stroke|stop-color|flood-color|lighting-color|caret-color|accent-color|text-decoration(?:-color)?|column-rule(?:-color)?|box-shadow|text-shadow|filter|--[\\w-]+)';

/* ---------- main extraction ---------- */
export function extractColours(text, ext) {
  const results = [];
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (off) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= off) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const lineText = (ln) => text.slice(lineStarts[ln - 1], ln < lineStarts.length ? lineStarts[ln] - 1 : text.length);

  // CSS regions: whole file for .css, <style> blocks (HTML, SVG, generator templates) otherwise.
  const cssRegions = [];
  if (ext === '.css') cssRegions.push([0, text.length]);
  else for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const s = m.index + m[0].indexOf('>') + 1;
    cssRegions.push([s, s + m[1].length]);
  }
  const cssEvents = cssRegions.map(([a, b]) => ({ a, b, events: cssSelectorIndex(text, a, b) }));
  const comments = commentRanges(text, ext);

  const contextAt = (off) => {
    for (const r of cssEvents) {
      if (off >= r.a && off < r.b) {
        const sel = selectorAt(r.events, off);
        const declStart = Math.max(text.lastIndexOf(';', off), text.lastIndexOf('{', off), r.a);
        const decl = text.slice(declStart + 1, off).replace(/\/\*[\s\S]*?(\*\/|$)/g, ' ');
        const pm = decl.match(/([\w-]+)\s*:/);
        return { selector: sel, property: pm ? pm[1] : '' };
      }
    }
    const tagStart = text.lastIndexOf('<', off);
    const tagEnd = text.indexOf('>', tagStart);
    if (tagStart !== -1 && tagEnd >= off && ext !== '.js' && ext !== '.mjs' && ext !== '.py') {
      const tag = text.slice(tagStart, Math.min(tagEnd + 1, tagStart + 200));
      const tm = tag.match(/^<([\w-]+)/);
      const cm = tag.match(/class="([^"]*)"/);
      const idm = tag.match(/id="([^"]*)"/);
      const attrStart = text.lastIndexOf('"', off);
      const am = text.slice(tagStart, attrStart).match(/([\w-]+)=$/);
      const inStyle = am && am[1] === 'style';
      let property = am ? am[1] : '';
      if (inStyle) {
        const seg = text.slice(attrStart + 1, off);
        const pm = seg.slice(Math.max(seg.lastIndexOf(';'), -1) + 1).match(/([\w-]+)\s*:/);
        property = pm ? pm[1] : 'style';
      }
      return {
        selector: `<${tm ? tm[1] : '?'}${idm ? '#' + idm[1] : ''}${cm ? '.' + cm[1].trim().split(/\s+/).join('.') : ''}>`,
        property,
      };
    }
    const lt = lineText(lineOf(off)).trim();
    const pm = text.slice(Math.max(0, off - 80), off).match(/([\w-]+)\s*[:=]\s*['"]?[^;'"]*$/);
    return { selector: lt.length > 90 ? lt.slice(0, 90) + '…' : lt, property: pm ? pm[1] : '' };
  };

  const push = (off, raw, kind, colour) => {
    const ctx = contextAt(off);
    const before = text.slice(Math.max(0, off - 400), off);
    const inGradient = /gradient\([^;{}]*$/i.test(before);
    const inShadowFn = /drop-shadow\([^;{}]*$/i.test(before);
    results.push({
      line: lineOf(off),
      offset: off,
      raw,
      kind,
      colour,
      comment: inComment(text, off, comments),
      selector: ctx.selector,
      property: ctx.property,
      gradient: inGradient,
      shadow: inShadowFn || /(^|-)shadow$/i.test(ctx.property) || /^--shadow/.test(ctx.property),
    });
  };

  // HEX (plain and %23-encoded)
  for (const m of text.matchAll(/(?<![&\w#%])(#|%23)([0-9a-fA-F]{3,8})(?![\w-])/g)) {
    const h = m[2];
    if (![3, 4, 6, 8].includes(h.length)) continue;
    if (m[1] === '#' && m.index > 0 && text[m.index - 1] === '&') continue;
    push(m.index, m[0], m[1] === '%23' ? 'hex-urlencoded' : 'hex', parseHex(h));
  }

  // rgb/rgba/hsl/hsla
  for (const m of text.matchAll(/(?<![\w-])(rgba?|hsla?)\(([^()]*)\)/gi)) {
    const c = parseFunc(m[1], m[2]);
    // Prose mentions of the function names and template placeholders carry no digits of
    // their own and are not colour values. Anything with digits that fails to parse IS reported.
    if (!c && (!/\d/.test(m[2].replace(/\$\{[^}]*\}/g, '')) || m[2].includes('${'))) continue;
    push(m.index, m[0], 'function', c); // null colour = unparseable, reported by the validator
  }

  // Named colours in colour-bearing contexts
  const namedScan = (valueStart, value) => {
    const cleaned = value
      .replace(/var\([^)]*\)/gi, (s) => ' '.repeat(s.length))
      .replace(/url\([^)]*\)/gi, (s) => ' '.repeat(s.length))
      .replace(/--[\w-]+/g, (s) => ' '.repeat(s.length))
      .replace(/['"][^'"]*['"]/g, (s) => ' '.repeat(s.length));
    for (const w of cleaned.matchAll(/(?<![\w-])([a-zA-Z]+)(?![\w-])/g)) {
      const word = w[1].toLowerCase();
      if (NAMED_COLOURS.has(word)) push(valueStart + w.index, w[1], 'named', null);
      else if (SYSTEM_COLOURS.has(word)) push(valueStart + w.index, w[1], 'system', null);
    }
  };
  const declRe = new RegExp(`(?<![\\w-])${COLOUR_PROPS}\\s*:\\s*([^;{}"\\n]*)`, 'gi');
  for (const m of text.matchAll(declRe)) {
    const vStart = m.index + m[0].length - m[1].length;
    namedScan(vStart, m[1]);
  }
  for (const m of text.matchAll(/\b(fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*"([^"]*)"/gi)) {
    namedScan(m.index + m[0].length - 1 - m[2].length, m[2]);
  }
  for (const m of text.matchAll(/\.style\.(color|background|backgroundColor|borderColor|outline|outlineColor|fill|stroke)\s*=\s*['"]([^'"]*)['"]/g)) {
    namedScan(m.index + m[0].length - 1 - m[2].length, m[2]);
  }

  // Python RGB/RGBA tuples (icon plate colours)
  if (ext === '.py') {
    for (const m of text.matchAll(/\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d{1,3}))?\)/g)) {
      const [r, g, b] = [m[1], m[2], m[3]].map(Number);
      const a = m[4] === undefined ? 1 : round3(Number(m[4]) / 255);
      push(m.index, m[0], 'tuple', { r, g, b, a });
    }
  }

  // de-duplicate (a hex inside a style attribute can be hit twice by context scans)
  const seen = new Set();
  return results
    .sort((x, y) => x.offset - y.offset)
    .filter((r) => {
      const k = `${r.offset}:${r.raw}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

/* ---------- WCAG ---------- */
function channel(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/* Composite top (with alpha) over an opaque bottom. */
export function composite(top, bottom) {
  const a = top.a === undefined ? 1 : top.a;
  return {
    r: Math.round(top.r * a + bottom.r * (1 - a)),
    g: Math.round(top.g * a + bottom.g * (1 - a)),
    b: Math.round(top.b * a + bottom.b * (1 - a)),
    a: 1,
  };
}
export function parseCssColour(str) {
  if (!str) return null;
  const s = str.trim();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hm = s.match(/^#([0-9a-f]{3,8})$/i);
  if (hm) return parseHex(hm[1]);
  const fm = s.match(/^(rgba?|hsla?)\((.*)\)$/i);
  if (fm) return parseFunc(fm[1], fm[2]);
  return null;
}
