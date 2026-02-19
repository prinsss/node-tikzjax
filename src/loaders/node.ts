import { createGunzip } from 'zlib';
import { createReadStream } from 'fs';
import { extract } from 'tar-fs';
import { IFs, Volume, createFsFromVolume } from 'memfs';
import { join, dirname } from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import type { ResourceLoader } from '../bootstrap.js';

declare module 'tar-fs' {
  interface ExtractOptions {
    fs?: IFs;
  }
}

/**
 * ResourceLoader implementation for Node.js.
 * Reads TeX resources from the local filesystem.
 */
export class NodeResourceLoader implements ResourceLoader {
  private coredump?: Uint8Array;
  private bytecode?: Uint8Array;
  private memfs?: IFs;
  private readonly texDir: string;

  /**
   * @param texDir Optional path to the directory containing core.dump.gz,
   *   tex.wasm.gz, and tex_files.tar.gz. Defaults to the tex/ directory
   *   bundled with this package.
   */
  constructor(texDir?: string) {
    this.texDir = texDir ?? resolveTexDir();
  }

  async preload(): Promise<void> {
    await Promise.all([this.loadCoredump(), this.loadBytecode()]);
  }

  async loadCoredump(): Promise<Uint8Array> {
    if (!this.coredump) {
      const stream = createReadStream(join(this.texDir, 'core.dump.gz')).pipe(createGunzip());
      this.coredump = await stream2buffer(stream);
    }
    return this.coredump;
  }

  async loadBytecode(): Promise<Uint8Array> {
    if (!this.bytecode) {
      const stream = createReadStream(join(this.texDir, 'tex.wasm.gz')).pipe(createGunzip());
      this.bytecode = await stream2buffer(stream);
    }
    return this.bytecode;
  }

  async loadTexFile(name: string): Promise<Uint8Array> {
    if (!this.memfs) {
      this.memfs = await this.extractTexFiles();
    }
    return this.memfs.readFileSync(name) as Buffer;
  }

  private async extractTexFiles(): Promise<IFs> {
    const volume = new Volume();
    const fs = createFsFromVolume(volume);

    fs.mkdirSync('/lib');

    const stream = createReadStream(join(this.texDir, 'tex_files.tar.gz'))
      .pipe(createGunzip())
      .pipe(
        extract('/tex_files', {
          fs,
        }),
      );

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return fs;
  }
}

async function stream2buffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const buf: Buffer[] = [];
    stream.on('data', (chunk) => buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buf)));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Resolve the path to the tex/ directory bundled with this package.
 */
function resolveTexDir(): string {
  // ESM
  try {
    const metaUrl = (import.meta as { url?: string }).url;
    if (metaUrl) {
      return join(dirname(fileURLToPath(metaUrl)), '../../tex');
    }
  } catch {
    // ignore
  }

  // CJS
  if (typeof __dirname !== 'undefined') {
    return join(__dirname as string, '../../tex');
  }

  throw new Error('Cannot resolve tex directory. Pass a custom `texDir` to NodeResourceLoader.');
}
