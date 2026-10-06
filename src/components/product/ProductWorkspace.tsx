'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductViewer } from '@/components/viewer/ProductViewer';
import { productManager } from '@/products/manager';
import { defaultProductId } from '@/products/registry';
import { ExportVideoModal } from '@/components/export/ExportVideoModal';

function writeProductUrl(id: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('product', id);
  window.history.replaceState(null, '', url);
}

interface ProductWorkspaceProps { initialProductId: string; invalidProductId?: string; debugMode?: boolean; }

export function ProductWorkspace({ initialProductId, invalidProductId, debugMode = false }: ProductWorkspaceProps) {
  const catalog = useMemo(() => productManager.list(), []);
  const [activeId, setActiveId] = useState(initialProductId);
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const active = productManager.load(activeId);
  const validation = productManager.validation(activeId);

  useEffect(() => {
    const syncFromUrl = () => {
      const requested = new URLSearchParams(window.location.search).get('product');
      if (requested && productManager.has(requested)) setActiveId(requested);
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
        onProductChange={switchProduct}
        onExport={() => setExportOpen(true)}
      />
      <ExportVideoModal debugMode={debugMode} open={exportOpen} product={active} validation={validation} onClose={() => setExportOpen(false)} />
    </>
  );
}
