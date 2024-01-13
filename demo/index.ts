import { join } from 'path';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { toTreeSync } from 'memfs/lib/print';
import tex2svg, { dumpMemfs, load, tex, dvi2svg } from '../src';

// A simplest example.
async function example1() {
  const source = `\\begin{document}
  \\begin{tikzpicture}
  \\draw (0,0) circle (1in);
  \\end{tikzpicture}
  \\end{document}`;

  const svg = await tex2svg(source, {
    showConsole: true,
  });

  console.log(svg);
}

// A more complicated example.
async function example2() {
  await load();
  console.log(toTreeSync(dumpMemfs()));

  const files = [
    'sample1.tex',
    'sample2.tex',
    'sample3.tex',
    'sample4.tex',
    'sample5.tex',
    'sample6.tex',
  ];

  mkdirSync('./demo/output', { recursive: true });

  for (const file of files) {
    const input = readFileSync(join('./demo/input', file), 'utf8');
    console.log('Processing:', file);
    const dvi = await tex(input);

    // writeFileSync('./demo/sample.dvi', dvi);
    const svg = await dvi2svg(dvi, {
      embedFontCss: true,
    });

    writeFileSync(join('./demo/output', file.replace('.tex', '.svg')), svg);
  }
}

// NOTE: Do not run two instances at the same time.
async function main() {
  await example1();
  await example2();
}

// Run with: `npx tsx demo/index.ts`
main();
