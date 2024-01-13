import { dvi2html } from '@prinsss/dvi2html';

export async function dvi2svg(dvi: Buffer) {
  let html = '';

  async function* streamBuffer() {
    yield Buffer.from(dvi);
    return;
  }

  await dvi2html(streamBuffer(), {
    write(chunk: string) {
      html = html + chunk.toString();
    },
  });

  return html;
}
