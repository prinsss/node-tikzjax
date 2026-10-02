import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { dvi2html } from '@prinsss/dvi2html';
import { JSDOM } from 'jsdom';
import { optimize } from 'svgo';

import { restoreUnicodeInSvg } from './unicode';

export type SvgOptions = {
  /**
   * Whether to embed the font CSS in the SVG.
   * - `false`: Don't embed font CSS (default)
   * - `true` or `'base64'` or `'inline'`: Embed base64 font data for fonts used in the SVG (self-contained, works completely offline)
   * - `'link'`: Embed `<style>@import url('...');</style>` pointing to `fontCssUrl`
   */
  embedFontCss?: boolean | 'base64' | 'inline' | 'link';

  /**
   * The URL of the font CSS file to embed when `embedFontCss` is `'link'`.
   * Default: `https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css`
   */
  fontCssUrl?: string;

  /**
   * Don't use SVGO to optimize the SVG. Default: `false`
   */
  disableOptimize?: boolean;

  /**
   * Don't use JSDOM to sanitize the SVG. Always return the raw SVG. Default: `false`
   * When turned on, the `embedFontCss` and `disableOptimize` options will be ignored.
   */
  disableSanitize?: boolean;
};

/**
 * Converts a DVI file to an SVG string.
 *
 * @param dvi The buffer containing the DVI file.
 * @param options The options.
 * @returns The SVG string.
 */
export async function dvi2svg(dvi: Buffer, options: SvgOptions = {}) {
  let html = '';

  const dom = new JSDOM(`<!DOCTYPE html>`);
  const document = dom.window.document;

  async function* streamBuffer() {
    yield Buffer.from(dvi);
    return;
  }

  await dvi2html(streamBuffer(), {
    write(chunk: string) {
      html = html + chunk.toString();
    },
  });

  // Patch: Assign unique IDs to SVG elements to avoid conflicts when inlining multiple SVGs.
  const ids = html.match(/\bid="pgf[^"]*"/g);
  if (ids) {
    // Sort the ids from longest to shortest.
    ids.sort((a, b) => b.length - a.length);
    const hash = hashCode(html);

    for (const id of ids) {
      const pgfIdString = id.replace(/id="pgf(.*)"/, '$1');
      html = html.replaceAll('pgf' + pgfIdString, `pgf${hash}${pgfIdString}`);
    }
  }

  // Patch: Fixes symbols stored in the SOFT HYPHEN character (e.g. \Omega, \otimes) not being rendered
  // Replaces soft hyphens with ¬
  html = html.replaceAll('&#173;', '&#172;');

  // Restore Unicode characters from placeholders
  html = restoreUnicodeInSvg(html);

  // JSDOM may fail to parse the generated SVG if the graph is too complex.
  // In this case, we can skip the sanitization step and return the raw SVG.
  // See: https://github.com/prinsss/node-tikzjax/issues/3
  if (options.disableSanitize) {
    return html;
  }

  // Fix errors in the generated HTML.
  const container = document.createRange().createContextualFragment(html);
  const svg = container.querySelector('svg')!;

  if (options.embedFontCss) {
    const defs = document.createElement('defs');
    const style = document.createElement('style');

    if (
      options.embedFontCss === 'link' ||
      (typeof options.embedFontCss === 'boolean' && options.fontCssUrl)
    ) {
      const fontCssUrl =
        options.fontCssUrl ?? 'https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css';
      style.textContent = `@import url('${fontCssUrl}');`;
    } else {
      // Embed Base64 TTF fonts for font families used in the SVG
      let fontCssRules = '';
      const fontFamilies = new Set<string>();
      const fontRegex = /font-family="([^",\s]+)/g;
      let fontMatch: RegExpExecArray | null;
      while ((fontMatch = fontRegex.exec(svg.outerHTML)) !== null) {
        if (fontMatch[1]) {
          fontFamilies.add(fontMatch[1]);
        }
      }

      for (const font of fontFamilies) {
        const fontFile = join(__dirname, '../css/bakoma/ttf', `${font}.ttf`);
        if (existsSync(fontFile)) {
          const fontData = readFileSync(fontFile).toString('base64');
          fontCssRules += `@font-face { font-family: ${font}; src: url('data:font/truetype;charset=utf-8;base64,${fontData}') format('truetype'); }\n`;
        }
      }

      if (fontCssRules) {
        style.textContent = fontCssRules;
      } else if (options.fontCssUrl) {
        style.textContent = `@import url('${options.fontCssUrl}');`;
      }
    }

    if (style.textContent) {
      defs.appendChild(style);
      svg.prepend(defs);
    }
  }

  if (options.disableOptimize) {
    return svg.outerHTML;
  }

  const optimizedSvg = optimize(svg.outerHTML, {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // Don't use the "cleanupIDs" plugin
            // To avoid problems with duplicate IDs ("a", "b", ...)
            // when inlining multiple svgs with IDs
            cleanupIds: false,
          },
        },
      },
    ],
  });

  return optimizedSvg.data;
}

/**
 * A helper function to generate a unique ID for each SVG element.
 *
 * @param str The string to hash.
 * @returns The hash of the string.
 */
export function hashCode(str: string) {
  const md5sum = createHash('md5');
  md5sum.update(str);
  return md5sum.digest('hex');
}
