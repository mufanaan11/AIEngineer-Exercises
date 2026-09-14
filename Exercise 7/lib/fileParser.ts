import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export class UnsupportedFileTypeError extends Error {
  constructor(filename: string) {
    super(`Unsupported file type: ${filename}`);
    this.name = 'UnsupportedFileTypeError';
  }
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

export async function extractText(file: File): Promise<string> {
  const extension = extensionOf(file.name);

  if (extension === 'txt' || extension === 'md') {
    return file.text();
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new UnsupportedFileTypeError(file.name);
}
