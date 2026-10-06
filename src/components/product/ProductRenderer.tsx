'use client';

import { Fragment, useEffect, useMemo } from 'react';
import type { ObjectRegistry } from '@/engine/product/ObjectRegistry';
import { ProductEngine } from '@/engine/product/ProductEngine';
import type { PartDefinition, ProductDefinition } from '@/types/product';
import { PartRenderer } from './PartRenderer';
import { GhostRenderer } from './GhostRenderer';

interface ProductRendererProps {
  product: ProductDefinition;
  registry: ObjectRegistry;
  selectedId: string | null;
  debug: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
}

export function ProductRenderer(props: ProductRendererProps) {
  const tree = useMemo(() => ProductEngine.build(props.product), [props.product]);
  const { onReady } = props;

  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  const renderPart = (part: PartDefinition): React.ReactNode => (
    <Fragment key={part.id}>
      {part.type === 'mesh' && <GhostRenderer part={part} registry={props.registry} />}
      <PartRenderer
        part={part}
        product={props.product}
        registry={props.registry}
        selectedId={props.selectedId}
        debug={props.debug}
        onSelect={props.onSelect}
      >
        {(tree.children.get(part.id) ?? []).map(renderPart)}
      </PartRenderer>
    </Fragment>
  );

  return <group name="product-root">{tree.roots.map(renderPart)}</group>;
}
