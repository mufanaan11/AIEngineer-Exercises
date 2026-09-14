import { readManifest } from '@/lib/manifest';

export const runtime = 'nodejs';

export async function GET() {
  const files = await readManifest();
  return Response.json({ files });
}
