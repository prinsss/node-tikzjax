# Node-TikZJax

A port of [TikZJax](https://tikzjax.com) runs on pure Node.js and WebAssembly.

Node-TikZJax lets you render LaTeX and TikZ diagrams to SVG images without the need to install LaTeX toolchain to the environment. You can render graphs, figures, circuits, chemical diagrams, commutative diagrams, and more.

## Installation

```bash
npm install node-tikzjax
```

## Examples

See the [demo](demo) folder for some example TikZ diagrams.

Live demo: [https://stackblitz.com/edit/node-tikzjax](https://stackblitz.com/edit/node-tikzjax)

![screenshot](https://github.com/prinsss/node-tikzjax/raw/main/demo/screenshot.png)

The example TeX source code is taken from [obsidian-tikzjax](https://github.com/artisticat1/obsidian-tikzjax).

## Usage

Basic usage:

```typescript
import tex2svg from 'node-tikzjax';

const source = `\\begin{document}
\\begin{tikzpicture}
\\draw (0,0) circle (1in);
\\end{tikzpicture}
\\end{document}`;

const svg = await tex2svg(source);
```

Which generates the following SVG:

```html
<svg xmlns="http://www.w3.org/2000/svg" width="193.253" height="193.253" viewBox="-72 -72 144.94 144.94">
  <path fill="none" stroke="#000" stroke-miterlimit="10" stroke-width=".4" d="M72.47.2c0-39.914-32.356-72.27-72.27-72.27S-72.07-39.714-72.07.2-39.714 72.47.2 72.47 72.47 40.114 72.47.2ZM.2.2"/>
</svg>
```

The input TeX source is rendered to DVI, then rendered to SVG.

- Remember to load any packages you need with `\usepackage{}`, and include `\begin{document}` and `\end{document}`.
- The standalone document class is used (`\documentclass{standalone}`).

The following packages are available in `\usepackage{}`:

- chemfig
- tikz-cd
- circuitikz
- pgfplots
- array
- amsmath
- amstext
- amsfonts
- amssymb
- tikz-3dplot

> [!NOTE]
> Don't run multiple instances of `node-tikzjax` at the same time. This may cause unexpected results.

## Advanced Usage

There are some options you can pass to `tex2svg()`:

```typescript
const svg = await tex2svg(source, {
  // Print log of TeX engine to console. Default: false.
  showConsole: true,
  // Additional TeX packages to load. Default: {}.
  // The following example results in `\usepackage{pgfplots}\usepackage[intlimits]{amsmath}`.
  texPackages: { pgfplots: '', amsmath: 'intlimits' },
  // Additional TikZ libraries to load. Default: ''.
  // The following example results in `\usetikzlibrary{arrows.meta,calc}`.
  tikzLibraries: 'arrows.meta,calc',
  // Additional source code to add to the preamble of input. Default: ''.
  addToPreamble: '% comment',
  // Add `<defs><style>@import url('fonts.css');</style></defs>` to SVG. Default: false.
  // This could be useful if you want to embed the SVG in a HTML file.
  embedFontCss: true,
  // URL of the font CSS file. Default: 'https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css'.
  fontCssUrl: 'https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css',
  // Disable SVG optimization with SVGO. Default: false.
  disableOptimize: false,
});
```

You can also separate the TeX rendering and DVI to SVG conversion steps:

```typescript
import { load, tex, dvi2svg } from 'node-tikzjax';

// Load the WebAssembly module and necessary files.
await load();

// Read TeX source from a file.
const input = readFileSync('sample.tex', 'utf8');

// Render TeX source to DVI.
const dvi = await tex(input, {
  showConsole: true,
  texPackages: { pgfplots: '', amsmath: 'intlimits' },
  tikzLibraries: 'arrows.meta,calc',
  addToPreamble: '% comment',
});

// Output generated DVI to a file.
writeFileSync('sample.dvi', dvi);

// Render DVI to SVG.
const svg = await dvi2svg(dvi, {
  embedFontCss: true,
  fontCssUrl: 'https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css',
  disableOptimize: false,
});

// Output generated SVG to a file.
writeFileSync('sample.svg', svg);
```

## Acknowledgements

This project is greatly inspired by [obsidian-tikzjax](https://github.com/artisticat1/obsidian-tikzjax).

This port would not be possible without the original [tikzjax](https://github.com/kisonecat/tikzjax) project.

Prebuilt WebAssembly binaries and supporting files are [downloaded](download.sh) from [artisticat1/tikzjax#output-single-file](https://github.com/artisticat1/tikzjax/tree/output-single-file).

A fork of [artisticat1/dvi2html#ww-modifications](https://github.com/artisticat1/dvi2html/tree/ww-modifications) is used to convert DVI to SVG.

The BaKoMa fonts shipped with this package are licensed under the [BaKoMa Fonts Licence](css/bakoma/LICENCE).

Thanks to all the authors for their great work!

## License

[LaTeX Project Public License v1.3c](LICENSE)
