import type { ResourceLoader } from '../bootstrap.js';

/**
 * ResourceLoader implementation for browsers.
 * Fetches TeX resources from a configurable base URL.
 */
export class BrowserResourceLoader implements ResourceLoader {
  private coredump?: Uint8Array;
  private bytecode?: Uint8Array;
  private texFiles?: Map<string, Uint8Array>;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
  }

  async preload(): Promise<void> {
    await Promise.all([this.loadCoredump(), this.loadBytecode()]);
  }

  async loadCoredump(): Promise<Uint8Array> {
    if (!this.coredump) {
      this.coredump = await fetchAndDecompress(`${this.baseUrl}/core.dump.gz`);
    }
    return this.coredump;
  }

  async loadBytecode(): Promise<Uint8Array> {
    if (!this.bytecode) {
      this.bytecode = await fetchAndDecompress(`${this.baseUrl}/tex.wasm.gz`);
    }
    return this.bytecode;
  }

  async loadTexFile(name: string): Promise<Uint8Array> {
    if (!this.texFiles) {
      await this.loadAllTexFiles();
    }

    const files = this.texFiles!;

    // The WASM engine requests files as e.g. "/tex_files/pgfplots.code.tex"
    // Try multiple key formats to find the file.
    const candidates = [
      name,
      name.replace(/^\/tex_files\//, '/'),
      name.replace(/^\/tex_files\//, ''),
      '/' + name.replace(/^\//, ''),
    ];

    for (const key of candidates) {
      const file = files.get(key);
      if (file) return file;
    }

    throw new Error(`File not found: ${name}`);
  }

  private async loadAllTexFiles(): Promise<void> {
    const tarBuf = await fetchAndDecompress(`${this.baseUrl}/tex_files.tar.gz`);
    this.texFiles = parseTar(tarBuf);
  }
}

/**
 * Fetch a URL and decompress the gzipped response body.
 */
async function fetchAndDecompress(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const compressed = await response.arrayBuffer();
  return decompressGzip(compressed);
}

/**
 * Decompress a gzipped ArrayBuffer using the native DecompressionStream API
 * (available in Chrome 80+, Firefox 113+, Safari 16.4+). Falls back to pako
 * if DecompressionStream is not available.
 */
async function decompressGzip(compressed: ArrayBuffer): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    writer.write(new Uint8Array(compressed));
    writer.close();

    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  // Fallback: use pako
  const { ungzip } = await import('pako');
  return ungzip(new Uint8Array(compressed));
}

/**
 * Parse a POSIX ustar tar archive and return a map of filename → file contents.
 *
 * The tar format uses 512-byte blocks:
 *   - bytes   0–99: filename (null-terminated ASCII)
 *   - bytes 124–135: file size in bytes (octal ASCII, null-terminated)
 *   - byte    156: type flag ('0' or '\0' = regular file, '5' = directory)
 */
function parseTar(buffer: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  let offset = 0;

  const decoder = new TextDecoder('ascii');

  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);

    // Two consecutive zero blocks signal end of archive.
    if (header.every((b) => b === 0)) break;

    const filename = decoder.decode(header.subarray(0, 100)).replace(/\0.*$/, '').trim();
    const sizeOctal = decoder.decode(header.subarray(124, 136)).replace(/\0.*$/, '').trim();
    const typeFlag = decoder.decode(header.subarray(156, 157));

    const size = parseInt(sizeOctal, 8);
    offset += 512; // advance past header

    if (typeFlag === '0' || typeFlag === '\0') {
      // Regular file
      const content = buffer.subarray(offset, offset + size);
      // Normalize the path: tar entries often have a leading ./ or directory prefix
      const normalizedName = filename.replace(/^\.\//, '').replace(/^tex_files\//, '');
      if (normalizedName) {
        files.set('/' + normalizedName, new Uint8Array(content));
        // Also store without leading slash for flexible lookup
        files.set(normalizedName, new Uint8Array(content));
      }
    }

    // Advance past the data (rounded up to nearest 512-byte boundary)
    offset += Math.ceil(size / 512) * 512;
  }

  return files;
}
