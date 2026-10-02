/**
 * Unicode support for node-tikzjax.
 *
 * Provides automatic translation and placeholder handling for Unicode characters
 * (including CJK, Greek, mathematical symbols, Cyrillic, emojis, etc.) so that
 * the WebAssembly TeX engine and DVI-to-SVG conversion can render them properly
 * without TeX `Package inputenc Error` or font metric errors.
 */

export function isFullWidth(codePoint: number): boolean {
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK Unified Ideographs
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK Extension A
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK Extension B
    (codePoint >= 0x2a700 && codePoint <= 0x2b73f) || // CJK Extension C
    (codePoint >= 0x2b740 && codePoint <= 0x2b81f) || // CJK Extension D
    (codePoint >= 0x2b820 && codePoint <= 0x2ceaf) || // CJK Extension E
    (codePoint >= 0x2ceb0 && codePoint <= 0x2ebef) || // CJK Extension F
    (codePoint >= 0x30000 && codePoint <= 0x3134f) || // CJK Extension G
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK Compatibility Ideographs
    (codePoint >= 0x2f800 && codePoint <= 0x2fa1f) || // CJK Compatibility Ideographs Supplement
    (codePoint >= 0x3040 && codePoint <= 0x309f) || // Hiragana
    (codePoint >= 0x30a0 && codePoint <= 0x30ff) || // Katakana
    (codePoint >= 0x31f0 && codePoint <= 0x31ff) || // Katakana Phonetic Extensions
    (codePoint >= 0xac00 && codePoint <= 0xd7af) || // Hangul Syllables
    (codePoint >= 0x1100 && codePoint <= 0x11ff) || // Hangul Jamo
    (codePoint >= 0x3130 && codePoint <= 0x318f) || // Hangul Compatibility Jamo
    (codePoint >= 0xa960 && codePoint <= 0xa97f) || // Hangul Jamo Extended-A
    (codePoint >= 0xd7b0 && codePoint <= 0xd7ff) || // Hangul Jamo Extended-B
    (codePoint >= 0x3000 && codePoint <= 0x303f) || // CJK Symbols and Punctuation
    (codePoint >= 0x3100 && codePoint <= 0x312f) || // Bopomofo
    (codePoint >= 0x31a0 && codePoint <= 0x31bf) || // Bopomofo Extended
    (codePoint >= 0x3190 && codePoint <= 0x319f) || // Kanbun
    (codePoint >= 0x3200 && codePoint <= 0x32ff) || // Enclosed CJK Letters and Months
    (codePoint >= 0x3300 && codePoint <= 0x33ff) || // CJK Compatibility
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) || // Yi Syllables & Radicals
    (codePoint >= 0xff01 && codePoint <= 0xff60) || // Fullwidth ASCII Variants
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) // Fullwidth Symbol Variants
  );
}

/**
 * Standard LaTeX math commands for common Unicode mathematical and Greek symbols.
 */
export const DEFAULT_UNICODE_MAP: Record<number, string> = {
  // Greek Lowercase
  0x03b1: '\\ensuremath{\\alpha}',
  0x03b2: '\\ensuremath{\\beta}',
  0x03b3: '\\ensuremath{\\gamma}',
  0x03b4: '\\ensuremath{\\delta}',
  0x03b5: '\\ensuremath{\\varepsilon}',
  0x03b6: '\\ensuremath{\\zeta}',
  0x03b7: '\\ensuremath{\\eta}',
  0x03b8: '\\ensuremath{\\theta}',
  0x03b9: '\\ensuremath{\\iota}',
  0x03ba: '\\ensuremath{\\kappa}',
  0x03bb: '\\ensuremath{\\lambda}',
  0x03bc: '\\ensuremath{\\mu}',
  0x03bd: '\\ensuremath{\\nu}',
  0x03be: '\\ensuremath{\\xi}',
  0x03c0: '\\ensuremath{\\pi}',
  0x03c1: '\\ensuremath{\\rho}',
  0x03c3: '\\ensuremath{\\sigma}',
  0x03c4: '\\ensuremath{\\tau}',
  0x03c5: '\\ensuremath{\\upsilon}',
  0x03c6: '\\ensuremath{\\phi}',
  0x03c7: '\\ensuremath{\\chi}',
  0x03c8: '\\ensuremath{\\psi}',
  0x03c9: '\\ensuremath{\\omega}',

  // Greek Uppercase
  0x0393: '\\ensuremath{\\Gamma}',
  0x0394: '\\ensuremath{\\Delta}',
  0x0398: '\\ensuremath{\\Theta}',
  0x039b: '\\ensuremath{\\Lambda}',
  0x039e: '\\ensuremath{\\Xi}',
  0x03a0: '\\ensuremath{\\Pi}',
  0x03a3: '\\ensuremath{\\Sigma}',
  0x03a5: '\\ensuremath{\\Upsilon}',
  0x03a6: '\\ensuremath{\\Phi}',
  0x03a8: '\\ensuremath{\\Psi}',
  0x03a9: '\\ensuremath{\\Omega}',

  0x2212: '\\ensuremath{-}',
  0x2216: '\\ensuremath{\\setminus}',
  0x2264: '\\ensuremath{\\le}',
  0x2265: '\\ensuremath{\\ge}',
  0x2260: '\\ensuremath{\\ne}',
  0x2248: '\\ensuremath{\\approx}',
  0x2261: '\\ensuremath{\\equiv}',
  0x223c: '\\ensuremath{\\sim}',
  0x221d: '\\ensuremath{\\propto}',
  0x226a: '\\ensuremath{\\ll}',
  0x226b: '\\ensuremath{\\gg}',
  0x00b1: '\\ensuremath{\\pm}',
  0x2213: '\\ensuremath{\\mp}',
  0x00d7: '\\ensuremath{\\times}',
  0x00f7: '\\ensuremath{\\div}',
  0x2217: '\\ensuremath{\\ast}',
  0x22c5: '\\ensuremath{\\cdot}',
  0x00b7: '\\ensuremath{\\cdot}',
  0x2218: '\\ensuremath{\\circ}',
  0x00b0: '\\ensuremath{^\\circ}', // Degree symbol

  // Superscripts & Fractions
  0x00b2: '\\ensuremath{^2}',
  0x00b3: '\\ensuremath{^3}',
  0x00b9: '\\ensuremath{^1}',
  0x2070: '\\ensuremath{^0}',
  0x207b: '\\ensuremath{^-}',
  0x00bd: '\\ensuremath{\\frac{1}{2}}',
  0x00bc: '\\ensuremath{\\frac{1}{4}}',
  0x00be: '\\ensuremath{\\frac{3}{4}}',
  0x00b5: '\\ensuremath{\\mu}', // Micro sign

  // Arrows
  0x2192: '\\ensuremath{\\rightarrow}',
  0x2190: '\\ensuremath{\\leftarrow}',
  0x2191: '\\ensuremath{\\uparrow}',
  0x2193: '\\ensuremath{\\downarrow}',
  0x2194: '\\ensuremath{\\leftrightarrow}',
  0x21d2: '\\ensuremath{\\Rightarrow}',
  0x21d0: '\\ensuremath{\\Leftarrow}',
  0x21d4: '\\ensuremath{\\Leftrightarrow}',
  0x21a6: '\\ensuremath{\\mapsto}',

  // Sets & Logic
  0x2208: '\\ensuremath{\\in}',
  0x2209: '\\ensuremath{\\notin}',
  0x2282: '\\ensuremath{\\subset}',
  0x2286: '\\ensuremath{\\subseteq}',
  0x2283: '\\ensuremath{\\supset}',
  0x2287: '\\ensuremath{\\supseteq}',
  0x222a: '\\ensuremath{\\cup}',
  0x2229: '\\ensuremath{\\cap}',
  0x2205: '\\ensuremath{\\emptyset}',
  0x221e: '\\ensuremath{\\infty}',
  0x2200: '\\ensuremath{\\forall}',
  0x2203: '\\ensuremath{\\exists}',
  0x2204: '\\ensuremath{\\nexists}',
  0x00ac: '\\ensuremath{\\neg}',
  0x2227: '\\ensuremath{\\land}',
  0x2228: '\\ensuremath{\\lor}',

  // Calculus & Algebra
  0x2211: '\\ensuremath{\\sum}',
  0x220f: '\\ensuremath{\\prod}',
  0x222b: '\\ensuremath{\\int}',
  0x222e: '\\ensuremath{\\oint}',
  0x221a: '\\ensuremath{\\surd}',
  0x2202: '\\ensuremath{\\partial}',
  0x2207: '\\ensuremath{\\nabla}',

  // Ellipsis & Dots
  0x2026: '\\ensuremath{\\dots}',
  0x22ef: '\\ensuremath{\\cdots}',
  0x22f1: '\\ensuremath{\\ddots}',
  0x22ee: '\\ensuremath{\\vdots}',

  // Delimiters & Shapes
  0x27e8: '\\ensuremath{\\langle}',
  0x27e9: '\\ensuremath{\\rangle}',
  0x2223: '\\ensuremath{\\mid}',
  0x2225: '\\ensuremath{\\parallel}',
  0x22a5: '\\ensuremath{\\bot}',
  0x22a4: '\\ensuremath{\\top}',
  0x2220: '\\ensuremath{\\angle}',
  0x2295: '\\ensuremath{\\oplus}',
  0x2296: '\\ensuremath{\\ominus}',
  0x2297: '\\ensuremath{\\otimes}',
  0x2298: '\\ensuremath{\\oslash}',
  0x2299: '\\ensuremath{\\odot}',
};

/**
 * Characters that are already natively supported by LaTeX's utf8.def without missing font errors.
 * Kept empty so that all Unicode characters (accents, symbols, CJK, etc.) are consistently
 * handled with proper system font fallback and XML escaping.
 */
const NATIVELY_SUPPORTED = new Set<number>([]);

/**
 * Scan input for Unicode characters and generate preamble definitions using `\DeclareUnicodeCharacter`.
 */
export function generateUnicodePreamble(
  text: string,
  customMap?: Record<string, string>
): string {
  // Check for any DeclareUnicodeCharacter already declared in the input
  const alreadyDeclared = new Set<string>();
  const declareRegex = /\\DeclareUnicodeCharacter\{([0-9A-Fa-f]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = declareRegex.exec(text)) !== null) {
    if (match[1]) {
      alreadyDeclared.add(match[1].toUpperCase());
    }
  }

  // Scan all unique characters
  const uniqueCodePoints = new Set<number>();
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp > 127 && !NATIVELY_SUPPORTED.has(cp)) {
      uniqueCodePoints.add(cp);
    }
  }

  let preamble = '';

  for (const cp of uniqueCodePoints) {
    const hex = cp.toString(16).toUpperCase().padStart(4, '0');
    if (alreadyDeclared.has(hex)) {
      continue;
    }

    const charStr = String.fromCodePoint(cp);

    // 1. Check user-provided custom map
    if (customMap && (customMap[charStr] || customMap[hex])) {
      const target = customMap[charStr] || customMap[hex];
      preamble += `\\DeclareUnicodeCharacter{${hex}}{${target}}\n`;
      continue;
    }

    // 2. Check default symbol map (LaTeX math / Greek symbols)
    if (DEFAULT_UNICODE_MAP[cp]) {
      preamble += `\\DeclareUnicodeCharacter{${hex}}{${DEFAULT_UNICODE_MAP[cp]}}\n`;
      continue;
    }

    // 3. General Unicode characters (CJK, Cyrillic, Emojis, etc.)
    // Uses cmtt font to avoid kerning splits between placeholder characters
    const width = isFullWidth(cp) ? '1em' : '0.5em';
    const placeholder = `TKZUNI${hex}`;
    preamble += `\\DeclareUnicodeCharacter{${hex}}{\\makebox[${width}][l]{\\fontfamily{cmtt}\\selectfont ${placeholder}}}\n`;
  }

  return preamble;
}

/**
 * Character mapping from TeX CMSY font encoding to Unicode characters.
 */
export const CMSY_TO_UNICODE: Record<number, string> = {
  33: '\u2192', // → rightarrow
  34: '\u2191', // ↑ uparrow
  35: '\u2193', // ↓ downarrow
  36: '\u2194', // ↔ leftrightarrow
  37: '\u2197', // ↗ nearrow
  38: '\u2198', // ↘ searrow
  39: '\u2243', // ≃ simeq
  40: '\u21D0', // ⇐ Leftarrow
  41: '\u21D2', // ⇒ Rightarrow
  42: '\u21D1', // ⇑ Uparrow
  43: '\u21D3', // ⇓ Downarrow
  44: '\u21D4', // ⇔ Leftrightarrow
  45: '\u2196', // ↖ nwarrow
  46: '\u2199', // ↙ swarrow
  47: '\u221D', // ∝ propto
  48: '\u2032', // ′ prime
  49: '\u221E', // ∞ infty
  50: '\u2208', // ∈ in
  51: '\u220B', // ∋ ni / owns
  52: '\u25B3', // △ triangle
  53: '\u25BD', // ▽ triangledown
  54: '\u2215', // ∕ not slash
  55: '\u21A6', // ↦ mapsto
  56: '\u2200', // ∀ forall
  57: '\u2203', // ∃ exists
  58: '\u00AC', // ¬ neg
  59: '\u2205', // ∅ emptyset
  60: '\u211C', // ℜ Re
  61: '\u2111', // ℑ Im
  62: '\u22A4', // ⊤ top
  63: '\u22A5', // ⊥ bot
  64: '\u2135', // ℵ aleph
  91: '\u222A', // ∪ cup
  92: '\u2229', // ∩ cap
  93: '\u228E', // ⊎ uplus
  94: '\u2227', // ∧ land / wedge
  95: '\u2228', // ∨ lor / vee
  96: '\u22A2', // ⊢ vdash
  97: '\u22A3', // ⊣ dashv
  98: '\u230A', // ⌊ lfloor
  99: '\u230B', // ⌋ rfloor
  100: '\u2308', // ⌈ lceil
  101: '\u2309', // ⌉ rceil
  102: '{', // { lbrace
  103: '}', // } rbrace
  104: '\u27E8', // ⟨ langle
  105: '\u27E9', // ⟩ rangle
  106: '\u2223', // ∣ mid
  107: '\u2225', // ∥ parallel
  108: '\u2195', // ↕ updownarrow
  109: '\u21D5', // ⇕ Updownarrow
  110: '\u2216', // ∖ setminus
  111: '\u2240', // ≀ wr
  112: '\u221A', // √ surd
  113: '\u2210', // ∐ amalg
  114: '\u2207', // ∇ nabla
  115: '\u222B', // ∫ int
  116: '\u2294', // ⊔ sqcup
  117: '\u2293', // ⊓ sqcap
  118: '\u2291', // ⊑ sqsubseteq
  119: '\u2292', // ⊒ sqsupseteq
  120: '\u00A7', // § section
  121: '\u2020', // † dagger
  122: '\u2021', // ‡ daggerdbl
  123: '\u00B6', // ¶ paragraph
  124: '\u2663', // ♣ club
  125: '\u2662', // ♢ diamond
  126: '\u2661', // ♡ heart
  161: '\u2212', // − minus
  162: '\u22C5', // ⋅ periodcentered / cdot
  163: '\u00D7', // × multiply / times
  164: '\u2217', // ∗ asteriskmath / ast
  165: '\u00F7', // ÷ divide / div
  166: '\u22C4', // ⋄ diamondmath
  167: '\u00B1', // ± plusminus / pm
  168: '\u2213', // ∓ minusplus / mp
  169: '\u2295', // ⊕ circleplus / oplus
  170: '\u2296', // ⊖ circleminus / ominus
  172: '\u00AC', // ¬ logicalnot
  173: '\u2297', // ⊗ circlemultiply / otimes
  174: '\u2298', // ⊘ circledivide / oslash
  175: '\u2299', // ⊙ circledot / odot
  176: '\u25EF', // ◯ circlecopyrt / bigcircle
  177: '\u25CB', // ○ openbullet / circ
  178: '\u2022', // • bullet
  179: '\u224D', // ≍ equivasymptotic / asymp
  180: '\u2261', // ≡ equivalence / equiv
  181: '\u2286', // ⊆ reflexsubset / subseteq
  182: '\u2287', // ⊇ reflexsuperset / supseteq
  184: '\u2265', // ≥ greaterequal / ge
  185: '\u227C', // ≼ precedesequal / preceq
  186: '\u227D', // ≽ followsequal / succeq
  187: '\u223C', // ∼ similar / sim
  188: '\u2248', // ≈ approxequal / approx
  189: '\u2282', // ⊂ propersubset / subset
  190: '\u2283', // ⊃ propersuperset / supset
  191: '\u226A', // ≪ lessmuch / ll
  192: '\u226B', // ≫ greatermuch / gg
  193: '\u227A', // ≺ precedes / prec
  194: '\u227B', // ≻ follows / succ
  195: '\u2190', // ← arrowleft / leftarrow
  196: '\u2660', // ♠ spade / spadesuit
  8729: '\u2264', // ≤ lessequal / le
};

/**
 * Character mapping from TeX CMMI font encoding to Unicode characters (Greek letters).
 */
export const CMMI_TO_UNICODE: Record<number, string> = {
  // Punctuation & Math Symbols
  58: '.', // period (in TeX cmmi, 58 ':' is period)
  59: ',', // comma (in TeX cmmi, 59 ';' is comma)
  61: '/', // slash (in TeX cmmi, 61 '=' is slash)
  63: '\u22C6', // ⋆ star
  64: '\u2202', // ∂ partialdiff
  91: '\u266D', // ♭ flat
  92: '\u266E', // ♮ natural
  93: '\u266F', // ♯ sharp
  96: '\u2113', // ℓ lscript
  123: '\u0131', // ı dotlessi
  124: '\u0237', // ȷ dotlessj
  125: '\u2118', // ℘ weierstrass

  // Greek Uppercase
  161: '\u0393', // Γ Gamma
  162: '\u0394', // Δ Delta
  163: '\u0398', // Θ Theta
  164: '\u039B', // Λ Lambda
  165: '\u039E', // Ξ Xi
  166: '\u03A0', // Π Pi
  167: '\u03A3', // Σ Sigma
  168: '\u03A5', // Υ Upsilon
  169: '\u03A6', // Φ Phi
  170: '\u03A8', // Ψ Psi
  173: '\u03A9', // Ω Omega
  174: '\u03B1', // α alpha
  175: '\u03B2', // β beta
  176: '\u03B3', // γ gamma
  177: '\u03B4', // δ delta
  178: '\u03B5', // ε epsilon
  179: '\u03B6', // ζ zeta
  180: '\u03B7', // η eta
  181: '\u03B8', // θ theta
  182: '\u03B9', // ι iota
  184: '\u03BB', // λ lambda
  185: '\u03BC', // μ mu
  186: '\u03BD', // ν nu
  187: '\u03BE', // ξ xi
  188: '\u03C0', // π pi
  189: '\u03C1', // ρ rho
  190: '\u03C3', // σ sigma
  191: '\u03C4', // τ tau
  192: '\u03C5', // υ upsilon
  193: '\u03C6', // φ phi
  194: '\u03C7', // χ chi
  195: '\u03C8', // ψ psi
  196: '\u03C9', // ω omega
  8729: '\u03BA', // κ kappa
};

function convertCmsyContent(content: string): string {
  content = content.replace(/&#(\d+);/g, (_m, numStr) => {
    const code = parseInt(numStr, 10);
    return CMSY_TO_UNICODE[code] || String.fromCodePoint(code);
  });
  let res = '';
  for (const char of content) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && CMSY_TO_UNICODE[cp]) {
      res += CMSY_TO_UNICODE[cp];
    } else {
      res += char;
    }
  }
  return res;
}

function convertCmmiContent(content: string): string {
  content = content.replace(/&#(\d+);/g, (_m, numStr) => {
    const code = parseInt(numStr, 10);
    return CMMI_TO_UNICODE[code] || String.fromCodePoint(code);
  });
  let res = '';
  for (const char of content) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && CMMI_TO_UNICODE[cp]) {
      res += CMMI_TO_UNICODE[cp];
    } else {
      res += char;
    }
  }
  return res;
}

/**
 * SVG path outline of Knuth's TeX radical glyph from CMSY font (char 112).
 * Units per em = 2048.
 */
export const CMSY_RADICAL_PATH =
  'M719 -1954 311 -1057 190 -1149Q184 -1155 176 -1155Q167 -1155 157.0 -1146.0Q147 -1137 147 -1126Q147 -1116 156 -1110L399 -926Q405 -920 414 -920Q427 -920 434 -934L801 -1741L1671 63Q1681 82 1706 82Q1723 82 1735.0 70.0Q1747 58 1747 41Q1747 31 1745 27L793 -1948Q780 -1966 760 -1966H737Q727 -1966 719 -1954Z';

/**
 * SVG path outlines of Knuth's TeX radical glyphs from CMEX font (chars 112..118).
 * Units per em = 2048.
 */
export const CMEX_RADICAL_PATHS: Record<string, string> = {
  p: 'M868 -2376 406 -1300 262 -1411 225 -1374 518 -1147 950 -2152 2013 63Q2023 82 2048 82Q2065 82 2077.0 70.0Q2089 58 2089 41Q2089 31 2087 27L944 -2357Q936 -2376 913 -2376Z',
  q: 'M868 -3604 403 -1980 262 -2144 225 -2105 518 -1761 954 -3285 2011 57Q2018 82 2048 82Q2065 82 2077.0 70.0Q2089 58 2089 41V33L948 -3580Q936 -3604 913 -3604Z',
  r: 'M868 -4833 401 -2658 262 -2875 225 -2839 518 -2376 956 -4413 2009 51Q2016 82 2048 82Q2065 82 2077.0 70.0Q2089 58 2089 41V33L950 -4803Q941 -4833 913 -4833Z',
  s: 'M868 -6062 399 -3336 262 -3609 225 -3570 518 -2990 956 -5544 2009 51Q2010 64 2022.5 73.0Q2035 82 2048 82Q2065 82 2077.0 70.0Q2089 58 2089 41V33L950 -6031Q947 -6043 936.5 -6052.5Q926 -6062 913 -6062Z',
  t: 'M1438 -3686 434 -645 264 -983 227 -944 520 -365 1438 -3146V4Q1438 20 1450.0 30.5Q1462 41 1479 41Q1494 41 1507.0 30.5Q1520 20 1520 4V-3647Q1520 -3674 1481 -3686Z',
  u: 'M1438 -1233V4Q1438 20 1450.0 30.5Q1462 41 1479 41Q1494 41 1507.0 30.5Q1520 20 1520 4V-1233Q1520 -1248 1507.0 -1259.0Q1494 -1270 1479 -1270Q1462 -1270 1450.0 -1259.0Q1438 -1248 1438 -1233Z',
  v: 'M1438 -1151V45Q1438 58 1450.0 70.0Q1462 82 1477 82H2167Q2182 82 2193.0 69.0Q2204 56 2204 41Q2204 24 2193.0 12.0Q2182 0 2167 0H1520V-1151Q1520 -1166 1507.0 -1177.0Q1494 -1188 1479 -1188Q1462 -1188 1450.0 -1177.0Q1438 -1166 1438 -1151Z',
};

import { CMEX_PATHS_BY_CODE } from './cmex_paths';

export { CMEX_PATHS_BY_CODE };

function decodeXmlChar(str: string): number | undefined {
  const trimmed = str.trim();
  if (trimmed.startsWith('&#') && trimmed.endsWith(';')) {
    return parseInt(trimmed.slice(2, -1), 10);
  }
  if (trimmed === '&quot;') return 34;
  if (trimmed === '&amp;') return 38;
  if (trimmed === '&lt;') return 60;
  if (trimmed === '&gt;') return 62;
  if (trimmed === '&apos;') return 39;
  if (trimmed.length > 0) {
    return trimmed.codePointAt(0);
  }
  return undefined;
}

/**
 * Replace TeX math radical glyph text elements with vector SVG paths.
 * In TeX, radical symbols are designed to connect with sub-pixel precision to horizontal rules.
 * Standard Unicode fonts do not have matching baseline metrics (sitting above rather than below baseline),
 * which causes radicals to detach and float far above the radicand in browsers without BaKoMa fonts.
 */
export function replaceRadicalsWithPaths(svg: string): string {
  return svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g, (fullMatch, attrStr, content) => {
    const fontMatch = attrStr.match(/font-family="([^",\s]+)/);
    if (!fontMatch) return fullMatch;
    const font = fontMatch[1];

    let pathD = '';
    const trimmed = content.trim();

    if (/^cmb?sy/i.test(font)) {
      if (trimmed === 'p' || trimmed === '&#112;' || trimmed === '\u221A') {
        pathD = CMSY_RADICAL_PATH;
      }
    } else if (/^cmex/i.test(font)) {
      const code = decodeXmlChar(trimmed);
      const codePath = code !== undefined ? CMEX_PATHS_BY_CODE[code] : undefined;
      const radicalPath = CMEX_RADICAL_PATHS[trimmed];
      if (codePath) {
        pathD = codePath;
      } else if (radicalPath) {
        pathD = radicalPath;
      }
    }

    if (!pathD) return fullMatch;

    const xMatch = attrStr.match(/\bx="([^"]*)"/);
    const yMatch = attrStr.match(/\by="([^"]*)"/);
    const sizeMatch = attrStr.match(/\bfont-size="([^"]*)"/);
    const fillMatch = attrStr.match(/\bfill="([^"]*)"/);
    const transformMatch = attrStr.match(/\btransform="([^"]*)"/);

    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const size = sizeMatch ? parseFloat(sizeMatch[1]) : 10;
    const fill = fillMatch ? fillMatch[1] : 'black';
    const scale = size / 2048;

    let transform = `translate(${x} ${y}) scale(${scale} ${-scale})`;
    if (transformMatch) {
      transform = `${transformMatch[1]} ${transform}`;
    }

    const otherAttrs = attrStr
      .replace(/\b(x|y|font-size|font-family|alignment-baseline|transform|fill)\s*=\s*"[^"]*"/g, '')
      .trim();

    return `<path d="${pathD}" fill="${fill}" transform="${transform}"${otherAttrs ? ' ' + otherAttrs : ''}/>`;
  });
}

/**
 * Restore Unicode characters and translate TeX math font symbols in the generated SVG.
 */
export function restoreUnicodeInSvg(svg: string): string {
  // 1. Replace placeholder tokens (TKZUNI) with their original characters
  if (svg.includes('TKZUNI')) {
    svg = svg.replace(/TKZUNI([0-9A-Fa-f]{4,6})/g, (_match, hex) => {
      const cp = parseInt(hex, 16);
      const char = String.fromCodePoint(cp);
      if (char === '&') return '&amp;';
      if (char === '<') return '&lt;';
      if (char === '>') return '&gt;';
      if (char === '"') return '&quot;';
      return char;
    });
  }

  // 2. Replace radical glyphs from cmsy and cmex with accurate SVG paths
  svg = replaceRadicalsWithPaths(svg);

  // 3. Translate TeX math CMSY symbol characters into Unicode
  svg = svg.replace(
    /(<text[^>]*font-family="[^"]*cmb?sy[^"]*"[^>]*>)([\s\S]*?)(<\/text>)/g,
    (_match, open, content, close) => open + convertCmsyContent(content) + close
  );

  // 3. Translate TeX math CMMI Greek characters into Unicode
  svg = svg.replace(
    /(<text[^>]*font-family="[^"]*cmm?ib?[0-9]*[^"]*"[^>]*>)([\s\S]*?)(<\/text>)/g,
    (_match, open, content, close) => open + convertCmmiContent(content) + close
  );

  // 4. Add system font fallback to all Computer Modern font elements
  svg = svg.replace(/font-family="([a-zA-Z0-9]+)"/g, (match, fontName) => {
    if (fontName.startsWith('cmtt')) {
      return `font-family="${fontName}, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'PingFang SC', 'Microsoft YaHei', monospace"`;
    }
    if (
      fontName.startsWith('cm') ||
      fontName.startsWith('msam') ||
      fontName.startsWith('msbm') ||
      fontName.startsWith('euf') ||
      fontName.startsWith('eur') ||
      fontName.startsWith('eus')
    ) {
      return `font-family="${fontName}, 'STIX Two Math', 'Cambria Math', 'Segoe UI Symbol', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"`;
    }
    return match;
  });

  return svg;
}

