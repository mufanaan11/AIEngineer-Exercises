import { promises as fs } from 'fs';
import path from 'path';

export interface UploadedFile {
  filename: string;
  chunkCount: number;
  uploadedAt: string;
}

const MANIFEST_PATH = path.join(process.cwd(), 'data', 'uploaded-files.json');

export async function readManifest(): Promise<UploadedFile[]> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function appendToManifest(entry: UploadedFile): Promise<void> {
  const files = await readManifest();
  files.push(entry);
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(files, null, 2));
}
