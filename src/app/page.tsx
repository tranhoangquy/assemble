import { ProductWorkspace } from '@/components/product/ProductWorkspace';
import { resolveProductSelection } from '@/products/registry';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const query = await searchParams;
  const requested = typeof query.product === 'string' ? query.product : '';
  const initialProductId = resolveProductSelection(requested);
  return <ProductWorkspace initialProductId={initialProductId} debugMode={query.debug === '1'} initialVideoType={query.video==='short'?'short':'long'} invalidProductId={requested && requested !== initialProductId ? requested : undefined} />;
}
