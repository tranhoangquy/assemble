import { exportJobManager } from '@/products/export-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: RouteContext<'/api/export/[jobId]'>) {
  const { jobId } = await context.params;
  await exportJobManager.ready();
  const job = exportJobManager.get(jobId);
  return job ? Response.json(job) : Response.json({ error: 'Export job not found.' }, { status: 404 });
}

export async function DELETE(_request: Request, context: RouteContext<'/api/export/[jobId]'>) {
  const { jobId } = await context.params;
  const job = await exportJobManager.cancel(jobId);
  return job ? Response.json(job) : Response.json({ error: 'Export job not found.' }, { status: 404 });
}


/** DELETE retains its legacy cancellation meaning. Explicit delete is a typed PATCH action. */
export async function PATCH(request: Request, context: RouteContext<'/api/export/[jobId]'>) {
  const { jobId } = await context.params;
  try {
    const body = await request.json() as { action?: string; productId?: string; profileId?: string; fps?: number };
    await exportJobManager.ready();
    const current = exportJobManager.get(jobId);
    if (!current) return Response.json({ error: 'Export job not found.' }, { status: 404 });
    if ((body.productId !== undefined && body.productId !== current.productId) || (body.profileId !== undefined && body.profileId !== current.profileId) || (body.fps !== undefined && body.fps !== current.fps)) return Response.json({ error: 'Selected product/profile/FPS does not match this job.' }, { status: 409 });
    if (body.action === 'delete') return Response.json({ deleted: await exportJobManager.delete(jobId) });
    if (body.action === 'cancel') return Response.json(await exportJobManager.cancel(jobId));
    if (body.action === 'resume') return Response.json(await exportJobManager.resume(jobId, new URL(request.url).origin), { status: 202 });
    return Response.json({ error: 'Unknown export action.' }, { status: 400 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Export action failed.' }, { status: 409 }); }
}
