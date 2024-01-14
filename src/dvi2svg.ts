import { createHash } from 'crypto';
import { dvi2html } from '@prinsss/dvi2html';
import { JSDOM } from 'jsdom';
import { optimize } from 'svgo';

export type SvgOptions = {
  /**
   * Whether to embed the font CSS file in the SVG. Default: `false`
   */
  embedFontCss?: boolean;

  /**
   * The URL of the font CSS file to embed.
   * Default: `https://tikzjax.com/v1/fonts.css`
   */
  fontCssUrl?: string;

  /**
   * Don't use SVGO to optimize the SVG. Default: `false`
   */
  disableOptimize?: boolean;
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

  // Fix errors in the generated HTML.
  const container = document.createRange().createContextualFragment(html);
  const svg = container.querySelector('svg')!;

  if (options.embedFontCss) {
    const defs = document.createElement('defs');
    const style = document.createElement('style');

    const fontCssUrl = options.fontCssUrl ?? 'https://tikzjax.com/v1/fonts.css';
    style.textContent = `@import url('${fontCssUrl}');`;
    defs.appendChild(style);
    svg.prepend(defs);
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
