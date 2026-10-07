'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductViewer } from '@/components/viewer/ProductViewer';
import { productManager } from '@/products/manager';
import { defaultProductId } from '@/products/registry';
import { selectPresentation, type VideoType } from '@/engine/video/PresentationSelection';
import { ExportVideoModal } from '@/components/export/ExportVideoModal';

function writeProductUrl(id: string, type: VideoType = 'long'): void {
  const url = new URL(window.location.href);
  url.searchParams.set('product', id);
  if(type==='short')url.searchParams.set('video','short');else url.searchParams.delete('video');
  window.history.replaceState(null, '', url);
}

interface ProductWorkspaceProps { initialProductId: string; invalidProductId?: string; debugMode?: boolean; initialVideoType?: VideoType; }

export function ProductWorkspace({ initialProductId, invalidProductId, debugMode = false, initialVideoType = 'long' }: ProductWorkspaceProps) {
  const catalog = useMemo(() => productManager.list(), []);
  const [activeId, setActiveId] = useState(initialProductId);
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const base = productManager.load(activeId);
  const [videoType,setVideoType] = useState<VideoType>(initialVideoType==='short' && productManager.load(initialProductId).shortPresentation ? 'short' : 'long');
  const active = selectPresentation(base,videoType==='short' && base.shortPresentation?'short':'long');
  const validation = productManager.validation(activeId);

  useEffect(() => {
    const syncFromUrl = () => {
      const requested = new URLSearchParams(window.location.search).get('product');
      if (requested && productManager.has(requested)) { setActiveId(requested); setVideoType(new URLSearchParams(window.location.search).get('video')==='short' && productManager.load(requested).shortPresentation?'short':'long'); }
      else {
        if (requested) console.warn(`Unknown product "${requested}"; using ${defaultProductId}.`);
        writeProductUrl(defaultProductId);
        setActiveId(defaultProductId);
      }
    };
    if (invalidProductId) console.warn(`Unknown product "${invalidProductId}"; using ${defaultProductId}.`);
    if (invalidProductId) writeProductUrl(defaultProductId);
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [catalog, invalidProductId]);

  const switchProduct = (id: string) => {
    if (id === activeId || !productManager.has(id)) return;
    setLoading(true);
    setTimeout(() => {
      setVideoType('long');
      setActiveId(id);
      writeProductUrl(id);
      setLoading(false);
    }, 0);
  };

  return (
    <>
      <ProductViewer
        key={active.id}
        debugMode={debugMode}
        product={active.product}
        assembly={active.assembly}
        video={active.video}
        catalog={debugMode ? catalog : catalog.filter(p => p.productKey !== active.productKey || p.id === defaultProductId || p.id === activeId)}
        activeProductId={active.id}
        loading={loading}
        videoType={videoType}
        shortAvailable={Boolean(base.shortPresentation)}
        onVideoTypeChange={(type)=>{setVideoType(type);writeProductUrl(activeId,type);}}
        onProductChange={switchProduct}
        onExport={() => setExportOpen(true)}
      />
      <ExportVideoModal key={`${active.id}:${active.video.id}`} debugMode={debugMode} open={exportOpen} product={active} validation={validation} onClose={() => setExportOpen(false)} />
    </>
  );
}
