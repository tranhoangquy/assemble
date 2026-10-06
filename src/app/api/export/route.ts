import { exportJobManager } from '@/products/export-manager';
import { productManager } from '@/products/manager';
import { resolveRenderProfile, type RenderProfileRequest } from '@/engine/export/RenderProfiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const productId = new URL(request.url).searchParams.get('productId') ?? '';
    if (!productManager.has(productId)) return Response.json({ error: 'Unknown product.' }, { status: 400 });
    return Response.json(await exportJobManager.list(productId));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Could not recover export jobs.' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as RenderProfileRequest & { productId?: string; videoId?: string; exportAnyway?: boolean };
    // Reject unknown/conflicting profile claims before launching any renderer.
    const profile = resolveRenderProfile(body);
    const validation = productManager.validation(body.productId ?? '');
    if (!validation.valid && !body.exportAnyway) {
      return Response.json({ error: `Assembly validation failed with ${validation.errors.length} blocking issue(s).`, validation }, { status: 409 });
    }
    const requestUrl = new URL(request.url);
    const job = exportJobManager.start({
      productId: body.productId ?? '',
      videoId: body.videoId,
      profileId: profile.id,
      fps: profile.fps,
      origin: requestUrl.origin,
    });
    return Response.json(job, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Invalid export request.' }, { status: 400 });
  }
}
