import { ExportJobManager } from '@/engine/export/ExportJobManager';
import { productManager } from './manager';
declare global { var __exportJobManager: ExportJobManager | undefined; }
const existing = globalThis.__exportJobManager;
// Hot reload must not keep the old in-memory-only implementation. Preserve
// legacy status/cancel/download access, but never invent its checkpoint identity.
export const exportJobManager = existing?.pipelineVersion === 3 && existing.usesCatalog?.(productManager) ? existing : new ExportJobManager(productManager, { legacyManager: existing });
globalThis.__exportJobManager = exportJobManager;
