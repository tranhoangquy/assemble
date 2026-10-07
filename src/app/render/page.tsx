import { ProductViewer } from '@/components/viewer/ProductViewer';
import { productManager } from '@/products/manager';
import { resolveRenderProfile } from '@/engine/export/RenderProfiles';

// Resolve creative data once on the server. Recomputing procedural coordinates
// in Chromium can differ from Node at the last floating-point bit and violates
// the export job's exact creative fingerprint.
export default async function RenderPage({ searchParams }: PageProps<'/render'>) {
  const query = await searchParams;
  const value = (key: string) => {
    const entry = query[key];
    return Array.isArray(entry) ? entry[0] : entry;
  };
  const initialTime = Number(value('time') ?? 0);
  const requestedProduct = value('project') ?? value('product') ?? productManager.list()[0].id;
  const active = productManager.load(productManager.has(requestedProduct) ? requestedProduct : productManager.list()[0].id, value('video'));
  // No-profile URLs retain viewport-driven custom CLI capture behavior.
  const renderProfile = value('profile') !== undefined ? resolveRenderProfile({
    profileId: value('profile'),
    fps: value('fps'),
  }) : undefined;
  const legacyFps = value('fps') !== undefined ? Number(value('fps')) : undefined;
  if (!renderProfile && legacyFps !== undefined && (!Number.isFinite(legacyFps) || legacyFps <= 0)) throw new Error('Custom CLI frame rate must be positive and finite.');
  const renderFps = renderProfile?.fps ?? legacyFps;
  return (
    <ProductViewer
      key={`${active.id}:${active.video.id}:${renderProfile?.id ?? 'legacy-viewport'}:${renderFps ?? active.video.fps}`}
      product={active.product}
      assembly={active.assembly}
      video={active.video}
      renderMode
      renderProfile={renderProfile}
      renderFps={renderFps}
      initialTime={Number.isFinite(initialTime) ? initialTime : 0}
    />
  );
}
