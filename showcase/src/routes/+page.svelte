<script lang="ts">
  import { onMount } from 'svelte';
  import { samples } from '$lib/samples';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Interactive editor state.
  let selectedIndex = $state(0);
  let editorSource = $state(samples[0]?.source ?? '');
  let browserSvg = $state('');
  let isRendering = $state(false);
  let renderError = $state('');
  let isLoaded = $state(false);
  let loadError = $state('');

  let tex2svg: ((src: string, opts?: object) => Promise<string>) | null = $state(null);

  // Lazy load resources.
  onMount(async () => {
    try {
      const mod = await import('isomorphic-tikzjax');
      tex2svg = mod.default;
      console.log('Preloading WebAssembly resources from CDN...');
      const loader = mod.getResourceLoader();
      await loader.preload();
      console.log('WebAssembly engine loaded successfully.');
      isLoaded = true;
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
    }
  });

  function selectSample(index: number) {
    selectedIndex = index;
    editorSource = samples[index]?.source ?? '';
    browserSvg = '';
    renderError = '';
  }

  async function renderInBrowser() {
    if (!tex2svg) return;
    isRendering = true;
    renderError = '';
    browserSvg = '';
    try {
      // Here we run the browser version of isomorphic-tikzjax.
      browserSvg = await tex2svg(editorSource, {
        ...samples[selectedIndex]?.options,
        embedFontCss: true,
        showConsole: true,
      });
    } catch (e) {
      renderError = e instanceof Error ? e.message : String(e);
    } finally {
      isRendering = false;
    }
  }
</script>

<svelte:head>
  <title>isomorphic-tikzjax demo</title>
</svelte:head>

<main>
  <header>
    <h1>isomorphic-tikzjax</h1>
    <p>Render TikZ diagrams to SVG in both Node.js and browser environments.</p>
  </header>

  <!-- SSR Gallery -->
  <section class="section">
    <div class="section-header">
      <div>
        <h2>
          SSR Gallery
          <span class="badge badge-server">Node.js</span>
        </h2>
        <p class="section-desc">
          All examples rendered on the server during first page load using Node.js.
        </p>
      </div>
    </div>
    <div class="gallery">
      {#each data.samples as sample}
        <div class="card">
          <div class="card-header">
            <h3>{sample.title}</h3>
            <p>{sample.description}</p>
          </div>
          <div class="card-body">
            {#if sample.error}
              <div class="error">
                <strong>Render error:</strong>
                {sample.error}
              </div>
            {:else}
              <div class="svg-output">
                {@html sample.svg}
              </div>
            {/if}
          </div>
          <details class="source-details">
            <summary>LaTeX source</summary>
            <pre class="source-code">{sample.source}</pre>
          </details>
        </div>
      {/each}
    </div>
  </section>

  <!-- Browser Live Editor -->
  <section class="section">
    <div class="section-header">
      <div>
        <h2>
          Live Editor
          <span class="badge badge-browser">Browser</span>
        </h2>
        <p class="section-desc">
          Renders TikZ source in your browser using WebAssembly. Resources (~5 MB) are fetched from
          jsDelivr CDN on page load.
        </p>
      </div>
    </div>

    <div class="editor-layout">
      <div class="editor-left">
        <div class="sample-tabs">
          {#each samples as sample, i}
            <button
              class="tab-btn"
              class:active={selectedIndex === i}
              onclick={() => selectSample(i)}
            >
              {sample.title}
            </button>
          {/each}
        </div>

        <textarea class="editor-textarea" bind:value={editorSource} spellcheck="false" rows="20"
        ></textarea>

        <div class="editor-actions">
          <button class="render-btn" onclick={renderInBrowser} disabled={isRendering || !isLoaded}>
            {#if isRendering}
              Rendering…
            {:else if !isLoaded && !loadError}
              Loading engine…
            {:else}
              Render in browser
            {/if}
          </button>

          {#if !isLoaded && !loadError}
            <span class="status-hint">Loading WebAssembly engine…</span>
          {/if}
          {#if loadError}
            <span class="status-error">Failed to load engine: {loadError}</span>
          {/if}
        </div>
      </div>

      <div class="editor-right">
        {#if renderError}
          <div class="error">
            <strong>Render error:</strong>
            <pre>{renderError}</pre>
          </div>
        {:else if browserSvg}
          <div class="svg-output svg-output--browser">
            {@html browserSvg}
          </div>
        {:else}
          <div class="editor-placeholder">
            {isRendering ? 'Rendering…' : 'Click "Render in browser" to see the output here.'}
          </div>
        {/if}
      </div>
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8f9fa;
    color: #212529;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }

  /* Header */
  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  header h1 {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: #1a1a2e;
  }

  header p {
    font-size: 1.1rem;
    color: #555;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Sections */
  .section {
    margin-bottom: 3.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.4rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .section-desc {
    color: #666;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* Badges */
  .badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .badge-server {
    background: #e3f2fd;
    color: #1565c0;
  }

  .badge-browser {
    background: #e8f5e9;
    color: #2e7d32;
  }

  /* Gallery grid */
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.25rem;
  }

  .card {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .card-header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .card-header h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
  }

  .card-header p {
    font-size: 0.82rem;
    color: #777;
    margin: 0;
    line-height: 1.4;
  }

  .card-body {
    padding: 1rem 1.25rem;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 140px;
    background: #fafafa;
  }

  .svg-output {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .svg-output :global(svg) {
    max-width: 100%;
    height: auto;
  }

  .svg-output--browser {
    min-height: 200px;
    padding: 1rem;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }

  /* Source code details */
  .source-details {
    border-top: 1px solid #f0f0f0;
  }

  .source-details summary {
    padding: 0.6rem 1.25rem;
    font-size: 0.8rem;
    color: #888;
    cursor: pointer;
    user-select: none;
  }

  .source-details summary:hover {
    background: #f5f5f5;
  }

  .source-code {
    margin: 0;
    padding: 0.75rem 1.25rem 1rem;
    font-size: 0.75rem;
    line-height: 1.5;
    background: #f8f8f8;
    overflow-x: auto;
    white-space: pre;
  }

  /* Error display */
  .error {
    font-size: 0.85rem;
    color: #c62828;
    background: #fff3f3;
    border: 1px solid #ffcdd2;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    width: 100%;
  }

  .error pre {
    margin: 0.4rem 0 0;
    white-space: pre-wrap;
    font-size: 0.8rem;
  }

  /* Live editor layout */
  .editor-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: stretch;
    }

    .editor-layout {
      grid-template-columns: 1fr;
    }
  }

  /* Sample tabs */
  .sample-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  .tab-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    transition: all 0.15s;
    color: #444;
  }

  .tab-btn:hover {
    border-color: #4caf50;
    color: #2e7d32;
  }

  .tab-btn.active {
    background: #e8f5e9;
    border-color: #4caf50;
    color: #2e7d32;
    font-weight: 600;
  }

  /* Textarea */
  .editor-textarea {
    width: 100%;
    font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: 0.82rem;
    line-height: 1.55;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    padding: 0.75rem;
    resize: vertical;
    box-sizing: border-box;
    background: #1e1e2e;
    color: #cdd6f4;
    outline: none;
    tab-size: 2;
  }

  .editor-textarea:focus {
    border-color: #4caf50;
  }

  /* Actions */
  .editor-actions {
    margin-top: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .render-btn {
    padding: 0.55rem 1.4rem;
    background: #2e7d32;
    color: #fff;
    border: none;
    border-radius: 7px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .render-btn:hover:not(:disabled) {
    background: #1b5e20;
  }

  .render-btn:disabled {
    background: #a5d6a7;
    cursor: not-allowed;
  }

  .status-hint {
    font-size: 0.82rem;
    color: #888;
  }

  .status-error {
    font-size: 0.82rem;
    color: #c62828;
  }

  /* Editor right panel */
  .editor-right {
    min-height: 300px;
  }

  .editor-placeholder {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    font-size: 0.9rem;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    text-align: center;
    padding: 2rem;
  }
</style>
