'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ProductViewer } from '@/components/viewer/ProductViewer';
import { productManager } from '@/products/manager';
import { resolveRenderProfile } from '@/engine/export/RenderProfiles';

function RenderContent() {
  const params = useSearchParams();
  const initialTime = Number(params.get('time') ?? 0);
  const requestedProduct = params.get('project') ?? params.get('product') ?? productManager.list()[0].id;
  const active = productManager.load(productManager.has(requestedProduct) ? requestedProduct : productManager.list()[0].id);
  // Explicit export profiles are validated, never inferred from arbitrary
  // client dimensions or silently downgraded. The historical no-profile render
  // URL remains viewport-driven for backward-compatible custom CLI captures.
  const renderProfile = params.has('profile') ? resolveRenderProfile({
    profileId: params.get('profile'),
    fps: params.get('fps') ?? undefined,
  }) : undefined;
  const legacyFps = params.has('fps') ? Number(params.get('fps')) : undefined;
  if (!renderProfile && legacyFps !== undefined && (!Number.isFinite(legacyFps) || legacyFps <= 0)) throw new Error('Custom CLI frame rate must be positive and finite.');
  const renderFps = renderProfile?.fps ?? legacyFps;
  return (
    <ProductViewer
      key={`${active.id}:${renderProfile?.id ?? 'legacy-viewport'}:${renderFps ?? active.video.fps}`}
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

export default function RenderPage() {
  return <Suspense fallback={<main className="render-stage" />}><RenderContent /></Suspense>;
}
