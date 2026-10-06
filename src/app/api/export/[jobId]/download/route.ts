import { exportJobManager } from '@/products/export-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: RouteContext<'/api/export/[jobId]/download'>) {
  const { jobId } = await context.params;
  const output = await exportJobManager.readOutput(jobId);
  if (!output) return Response.json({ error: 'Video is not ready or has expired.' }, { status: 404 });
  return new Response(output.stream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(output.size),
      'Content-Disposition': `attachment; filename="${output.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
