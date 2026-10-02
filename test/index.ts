import assert from 'assert';
import tex2svg, { tex, dvi2svg } from '../src';

async function main() {
  console.log('--- Running node-tikzjax test suite ---');

  // Test 1: ASCII
  console.log('Test 1: ASCII rendering');
  const svg1 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {Hello World};\\end{tikzpicture}\\end{document}');
  assert(svg1.includes('Hello') && svg1.includes('orld'), 'Should contain Hello and orld');
  assert(!svg1.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 2: Chinese with punctuation
  console.log('Test 2: Chinese with punctuation');
  const svg2 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node[draw] {你好，世界！这是TikZ图表。};\\end{tikzpicture}\\end{document}');
  for (const char of '你好，世界！这是TikZ图表。') {
    assert(svg2.includes(char), `Should contain character '${char}'`);
  }
  assert(!svg2.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 3: Japanese
  console.log('Test 3: Japanese (Hiragana & Kanji)');
  const svg3 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node[draw] {こんにちは世界};\\end{tikzpicture}\\end{document}');
  for (const char of 'こんにちは世界') {
    assert(svg3.includes(char), `Should contain character '${char}'`);
  }
  assert(!svg3.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 4: Korean
  console.log('Test 4: Korean (Hangul)');
  const svg4 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node[draw] {안녕하세요 세계};\\end{tikzpicture}\\end{document}');
  for (const char of '안녕하세요 세계') {
    if (char !== ' ') {
      assert(svg4.includes(char), `Should contain character '${char}'`);
    }
  }
  assert(!svg4.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 5: Cyrillic
  console.log('Test 5: Cyrillic');
  const svg5 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node[draw] {Привет мир};\\end{tikzpicture}\\end{document}');
  for (const char of 'Привет мир') {
    if (char !== ' ') {
      assert(svg5.includes(char), `Should contain character '${char}'`);
    }
  }
  assert(!svg5.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 6: Greek and Math symbols
  console.log('Test 6: Greek & Math symbols (alpha, beta, le, gamma, rightarrow)');
  const svg6 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {$\\alpha + \\beta \\le \\gamma \\rightarrow 1$};\\end{tikzpicture}\\end{document}');
  assert(!svg6.includes('TKZUNI'), 'Should not contain placeholders');
  assert(svg6.length > 100, 'Should generate valid SVG');
  console.log('  PASS');

  // Test 7: Degree symbol
  console.log('Test 7: Degree symbol (90°)');
  const svg7 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {Angle: 90°};\\end{tikzpicture}\\end{document}');
  assert(!svg7.includes('TKZUNI'), 'Should not contain placeholders');
  assert(svg7.length > 100, 'Should generate valid SVG');
  console.log('  PASS');

  // Test 8: Emoji
  console.log('Test 8: Emoji');
  const svg8 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {Smile 😊};\\end{tikzpicture}\\end{document}');
  assert(svg8.includes('😊'), 'Should contain emoji 😊');
  assert(!svg8.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 9: Custom unicodeMap
  console.log('Test 9: Custom unicodeMap option');
  const svg9 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {♥};\\end{tikzpicture}\\end{document}', {
    unicodeMap: { '♥': '\\ensuremath{\\heartsuit}' },
  });
  assert(!svg9.includes('TKZUNI'), 'Should not contain placeholders');
  assert(svg9.length > 100, 'Should generate valid SVG');
  console.log('  PASS');

  // Test 10: Two-step API (tex then dvi2svg)
  console.log('Test 10: Two-step API (tex then dvi2svg)');
  const dvi = await tex('\\begin{document}\\begin{tikzpicture}\\node[draw] {两步渲染: $E=mc^2$};\\end{tikzpicture}\\end{document}');
  const svg10 = await dvi2svg(dvi);
  for (const char of '两步渲染') {
    assert(svg10.includes(char), `Should contain character '${char}'`);
  }
  assert(!svg10.includes('TKZUNI'), 'Should not contain placeholders');
  console.log('  PASS');

  // Test 11: Math symbols translation (cap, emptyset, minus, subseteq)
  console.log('Test 11: Math symbols translation (\\cap, \\emptyset, -, \\subseteq)');
  const svg11 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {$A\\cap B=\\emptyset$};\\node {$-$};\\node {\\subseteq};\\end{tikzpicture}\\end{document}');
  assert(svg11.includes('∩'), 'Should translate \\cap to ∩');
  assert(svg11.includes('∅'), 'Should translate \\emptyset to ∅');
  assert(svg11.includes('−'), 'Should translate math minus to −');
  assert(svg11.includes('⊆'), 'Should translate \\subseteq to ⊆ in text mode');
  console.log('  PASS');

  // Test 12: Chinese combined with math symbols
  console.log('Test 12: Chinese combined with math symbols (交集 $A\\cap B$)');
  const svg12 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node at (-3.9,2.4) {交集 $A\\cap B$};\\end{tikzpicture}\\end{document}');
  assert(svg12.includes('交') && svg12.includes('集'), 'Should contain Chinese characters');
  assert(svg12.includes('∩'), 'Should contain ∩');
  assert(!svg12.includes('>\\<'), 'Should not display backslash for intersection');
  console.log('  PASS');

  // Test 13: Base64 font embedding
  console.log('Test 13: Base64 font embedding (embedFontCss: true)');
  const svg13 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {$A\\cap B$};\\end{tikzpicture}\\end{document}', {
    embedFontCss: true,
  });
  assert(svg13.includes('@font-face'), 'Should include @font-face rules');
  assert(svg13.includes('data:font/truetype;charset=utf-8;base64,'), 'Should include base64 font data');
  console.log('  PASS');

  // Test 14: Math punctuation translation (comma, period, slash, partial)
  console.log('Test 14: Math punctuation translation ($,$, $(x, y)$, $3.14$, $a/b$, $\\partial$)');
  const svg14 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {$(x, y)$};\\node {$3.14$};\\node {$a/b$};\\node {$\\partial f$};\\end{tikzpicture}\\end{document}');
  assert(svg14.includes('x,'), 'Should translate math comma to , (not ;)');
  assert(!svg14.includes('x;'), 'Must not contain x;');
  assert(svg14.includes('3') && svg14.includes('.') && svg14.includes('14'), 'Should translate math period to . (not :)');
  assert(svg14.includes('a/b'), 'Should translate math slash to / (not =)');
  assert(svg14.includes('∂'), 'Should translate \\partial to ∂ (not @)');
  console.log('  PASS');

  // Test 15: Square root rendering in math mode ($\sqrt{ab}$)
  console.log('Test 15: Square root rendering in math mode ($\\sqrt{ab}$)');
  const svg15 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {$\\sqrt{ab}$};\\end{tikzpicture}\\end{document}');
  assert(svg15.includes('ab'), 'Should contain radicand ab');
  assert(!svg15.includes('>p<'), 'Must not render radical as letter p');
  assert(!svg15.includes('>√<'), 'Radical must be rendered as vector path rather than detached fallback font glyph');
  assert(svg15.includes('<path'), 'Must contain path elements for radical and overbar');
  console.log('  PASS');

  // Test 16: Square root in text mode (\node {\sqrt{ab}}; \node {\sqrt[3]{8}};)
  console.log('Test 16: Square root in text mode (\\node {\\sqrt{ab}}; \\node {\\sqrt[3]{8}};)');
  const svg16 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {\\sqrt{ab} and \\sqrt[3]{8}};\\end{tikzpicture}\\end{document}');
  assert(svg16.includes('ab') && svg16.includes('8'), 'Should compile and contain content in text mode');
  assert(!svg16.includes('>p<'), 'Must not render radical as letter p');
  console.log('  PASS');

  // Test 17: Math delimiters and tfrac rendering (\left( \right) and \left\{ \right\})
  console.log('Test 17: Math delimiters and tfrac rendering (\\left( \\right) and \\left\\{ \\right\\})');
  const svg17 = await tex2svg('\\begin{document}\\begin{tikzpicture}\\node {$\\left(\\tfrac{\\sqrt2}{2},\\tfrac{\\sqrt2}{2}\\right)$};\\node {$\\left\\{\\tfrac{\\sqrt2}{2},\\tfrac{\\sqrt2}{2}\\right\\}$};\\end{tikzpicture}\\end{document}');
  assert(!svg17.includes('>³<'), 'Must not render left parenthesis delimiter as ³');
  assert(!svg17.includes('>´<'), 'Must not render right parenthesis delimiter as ´');
  assert(!svg17.includes('>n<'), 'Must not render left brace delimiter as n');
  assert(!svg17.includes('>o<'), 'Must not render right brace delimiter as o');
  assert(!svg17.includes('font-family="cmex10'), 'Delimiters must be converted to vector paths instead of missing cmex font text');
  assert(svg17.includes('<path'), 'Must contain path elements for vector delimiters');
  console.log('  PASS');

  console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
