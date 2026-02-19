import { TeXOptions, tex } from './bootstrap.js';
import { SvgOptions, dvi2svg } from './dvi2svg.js';
import { NodeResourceLoader } from './loaders/node.js';

export * from './bootstrap.js';
export * from './dvi2svg.js';
export * from './loaders/node.js';

export type NodeOptions = {
  /**
   * Base path for reading TeX resources (core.dump.gz, tex.wasm.gz, tex_files.tar.gz).
   * Default: bundled in the package, will resolve to `isomorphic-tikzjax/tex`.
   *
   * Make sure the following files are available:
   * - {texResourcesDir}/core.dump.gz
   * - {texResourcesDir}/tex.wasm.gz
   * - {texResourcesDir}/tex_files.tar.gz
   */
  texResourcesDir?: string;
};

let loader: NodeResourceLoader | null = null;

function getResourceLoader(options?: NodeOptions): NodeResourceLoader {
  const texDir = options?.texResourcesDir;

  if (!texDir) {
    if (!loader) {
      loader = new NodeResourceLoader();
    }
    return loader;
  }

  return new NodeResourceLoader(texDir);
}

/**
 * Compiles TeX source code to SVG image (Node.js).
 */
export async function tex2svg(
  input: string,
  options?: TeXOptions & SvgOptions & NodeOptions,
): Promise<string> {
  const loader = getResourceLoader(options);
  const dvi = await tex(input, options, loader);
  const svg = await dvi2svg(dvi, options);
  return svg;
}

export default tex2svg;
