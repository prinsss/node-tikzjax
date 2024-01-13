import { createGunzip } from 'zlib';
import { createReadStream } from 'fs';
import { extract } from 'tar-fs';
import { IFs, Volume, createFsFromVolume } from 'memfs';
import { join } from 'path';
import { Readable } from 'stream';
import * as library from './library';

declare module 'tar-fs' {
  interface ExtractOptions {
    fs?: IFs;
  }
}

// The cached unzipped data of file `core.dump.gz`.
let coredump: Uint8Array;

// The cached unzipped data of file `tex.wasm.gz`.
let bytecode: Uint8Array;

// The memory filesystem that stores the TeX files extracted from `tex_files.tar.gz`.
let memfs: IFs;

// The directory where the TeX files are located (core.dump.gz, tex.wasm.gz, tex_files.tar.gz).
const TEX_DIR = join(__dirname, '../tex');

// Paths of the TeX files.
const COREDUMP_PATH = join(TEX_DIR, 'core.dump.gz');
const BYTECODE_PATH = join(TEX_DIR, 'tex.wasm.gz');
const TEX_FILES_PATH = join(TEX_DIR, 'tex_files.tar.gz');
const TEX_FILES_EXTRACTED_PATH = join('/', 'tex_files');

/**
 * Load necessary files into memory.
 */
export async function load() {
  if (!coredump) {
    const stream = createReadStream(COREDUMP_PATH).pipe(createGunzip());
    coredump = await stream2buffer(stream);
  }

  if (!bytecode) {
    const stream = createReadStream(BYTECODE_PATH).pipe(createGunzip());
    bytecode = await stream2buffer(stream);
  }

  if (!memfs) {
    memfs = await extractTexFilesToMemory();
  }
}

/**
 * For detailed explanation of available options, see
 * https://github.com/artisticat1/tikzjax/tree/ww-modifications#options
 */
export type TeXOptions = {
  showConsole?: boolean;
  texPackages?: Record<string, string>;
  tikzLibraries?: string;
  tikzOptions?: string;
  addToPreamble?: string;
};

/**
 * Run the TeX engine to compile TeX source code.
 *
 * @param input The TeX source code.
 * @returns The generated DVI file.
 */
export async function tex(input: string, options: TeXOptions = {}) {
  // Set up the tex input file.
  const preamble = getTexPreamble(options);
  input = preamble + input;

  if (options.showConsole) {
    library.setShowConsole();

    console.log('TikZJax: Rendering input:');
    console.log(input);
  }

  // Write the tex input file into the memory filesystem.
  library.writeFileSync('input.tex', Buffer.from(input));

  // Copy the coredump into the memory.
  const memory = new WebAssembly.Memory({ initial: library.pages, maximum: library.pages });
  const buffer = new Uint8Array(memory.buffer, 0, library.pages * 65536);
  buffer.set(coredump.slice(0));

  library.setMemory(memory.buffer);
  library.setInput(' input.tex \n\\end\n');

  // Set the file loader to read files from the memory filesystem.
  library.setFileLoader(readTexFileFromMemory);

  // Set up the WebAssembly TeX engine.
  const wasm = await WebAssembly.instantiate(bytecode, {
    library: library,
    env: { memory: memory },
  });

  // Execute TeX and extract the generated DVI file.
  await library.executeAsync(wasm.instance.exports);

  try {
    const dvi = Buffer.from(library.readFileSync('input.dvi'));

    // Clean up the library for the next run.
    library.deleteEverything();

    return dvi;
  } catch (e) {
    library.deleteEverything();
    throw new Error('TeX engine render failed. Set `options.showConsole` to `true` to see logs.');
  }
}

/**
 * Get preamble of the TeX input file.
 */
export function getTexPreamble(options: TeXOptions = {}) {
  let texPackages = options.texPackages ?? {};

  const preamble =
    Object.entries(texPackages).reduce((usePackageString, thisPackage) => {
      usePackageString +=
        '\\usepackage' + (thisPackage[1] ? `[${thisPackage[1]}]` : '') + `{${thisPackage[0]}}`;
      return usePackageString;
    }, '') +
    (options.tikzLibraries ? `\\usetikzlibrary{${options.tikzLibraries}}` : '') +
    (options.addToPreamble || '') +
    (options.tikzOptions ? `[${options.tikzOptions}]` : '') +
    '\n';

  return preamble;
}

/**
 * Dump the memory filesystem for debug.
 *
 * @example
 * ```js
 * import { toTreeSync } from 'memfs/lib/print';
 * console.log(toTreeSync(dumpMemfs()));
 * ```
 */
export function dumpMemfs() {
  return memfs;
}

/**
 * Extract files from `tex_files.tar.gz` into a memory filesystem.
 * The tarball contains files needed by the TeX engine, such as `pgfplots.code.tex`.
 */
async function extractTexFilesToMemory() {
  const volume = new Volume();
  const fs = createFsFromVolume(volume);

  fs.mkdirSync('/lib');

  const stream = createReadStream(TEX_FILES_PATH).pipe(createGunzip()).pipe(
    extract(TEX_FILES_EXTRACTED_PATH, {
      fs,
    })
  );

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return fs;
}

/**
 * Read a file from the memory filesystem.
 */
async function readTexFileFromMemory(name: string) {
  const buffer = memfs.readFileSync(name) as Buffer;
  return buffer;
}

/**
 * Convert a stream to a buffer.
 */
async function stream2buffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const buf: Buffer[] = [];

    stream.on('data', (chunk) => buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buf)));
    stream.on('error', (err) => reject(err));
  });
}
