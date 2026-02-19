import tex2svg from 'isomorphic-tikzjax';
import type { PageServerLoad } from './$types';
import { samples } from '$lib/samples';

let cachedSamples: Array<{
  title: string;
  description: string;
  source: string;
  svg: string;
  error: string | null;
}> | null = null;

export const load: PageServerLoad = async () => {
  if (cachedSamples) {
    console.log('[SSR Cache] Returning cached samples');
    return { samples: cachedSamples };
  }

  console.log('[SSR Cache] Rendering samples for the first time...');

  // Render all samples sequentially.
  const renderedSamples: Array<{
    title: string;
    description: string;
    source: string;
    svg: string;
    error: string | null;
  }> = [];

  for (const sample of samples) {
    try {
      // Here we run the Node.js version of isomorphic-tikzjax.
      const svg = await tex2svg(sample.source, {
        ...sample.options,
        embedFontCss: true,
        showConsole: true,
      });
      renderedSamples.push({ ...sample, svg, error: null });
    } catch (e) {
      renderedSamples.push({
        ...sample,
        svg: '',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Cache the results.
  cachedSamples = renderedSamples;
  console.log('[SSR Cache] Samples cached');

  return { samples: renderedSamples };
};

export const prerender = true;
