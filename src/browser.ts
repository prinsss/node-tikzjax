import { TeXOptions, tex } from './bootstrap.js';
import { SvgOptions, dvi2svg } from './dvi2svg.js';
import { BrowserResourceLoader } from './loaders/browser.js';

export * from './bootstrap.js';
export * from './dvi2svg.js';
export * from './loaders/browser.js';

const DEFAULT_TEX_URL = 'https://cdn.jsdelivr.net/npm/isomorphic-tikzjax@latest/tex';

export type BrowserOptions = {
  /**
   * Base URL for fetching TeX resources (core.dump.gz, tex.wasm.gz, tex_files.tar.gz).
   * Default: `https://cdn.jsdelivr.net/npm/isomorphic-tikzjax@latest/tex`
   *
   * To setup a mirror server, make sure the following files are available:
   * - {texResourcesUrl}/core.dump.gz
   * - {texResourcesUrl}/tex.wasm.gz
   * - {texResourcesUrl}/tex_files.tar.gz
   */
  texResourcesUrl?: string;
};

let loader: BrowserResourceLoader | null = null;

function getResourceLoader(options?: BrowserOptions): BrowserResourceLoader {
  const baseUrl = options?.texResourcesUrl ?? DEFAULT_TEX_URL;

  if (!options?.texResourcesUrl) {
    if (!loader) {
      loader = new BrowserResourceLoader(baseUrl);
    }
    return loader;
  }

  return new BrowserResourceLoader(baseUrl);
}

/**
 * Compiles TeX source code to SVG image (browser).
 */
export async function tex2svg(
  input: string,
  options?: TeXOptions & SvgOptions & BrowserOptions,
): Promise<string> {
  const loader = getResourceLoader(options);
  const dvi = await tex(input, options, loader);
  const svg = await dvi2svg(dvi, options);
  return svg;
}

export default tex2svg;
