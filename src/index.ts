import { readFileSync, writeFileSync } from 'fs';
import { load, tex } from './bootstrap';
import { dvi2svg } from './dvi2svg';

async function main() {
  await load();

//   const input = `
// \\begin{document}
// \\begin{tikzpicture}
//   \\draw (0,0) circle (1in);
// \\end{tikzpicture}
// \\end{document}`;

//   await tex(input);

  const input = readFileSync('./demo/sample.tex', 'utf8');
  const dvi = await tex(input);

  writeFileSync('./demo/sample.dvi', dvi);

  const svg = await dvi2svg(dvi);
  writeFileSync('./demo/sample.svg', svg);
}

main();
