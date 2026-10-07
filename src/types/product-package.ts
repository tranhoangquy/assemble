import type { AssemblyDefinition } from './assembly';
import type { ProductDefinition } from './product';
import type { VideoDefinition, CameraPreset } from './video';
import type { DirectorPlan } from './director';

export interface RenderCheckpoint { name: string; time: number; /** Inspection only; never changes playback cameras. */ camera?:CameraPreset; }
export interface ProductPackage {
  id: string;
  productKey: string;
  label: string;
  filename: string;
  reviewDirectory?: string;
  product: ProductDefinition;
  assembly: AssemblyDefinition;
  video: VideoDefinition;
  /** Optional presentation over the same product and AssemblyGraph. Long stays the default. */
  shortPresentation?: { video: VideoDefinition; filename: string; checkpoints?: RenderCheckpoint[]; }; 
  directorPlan?: DirectorPlan;
  checkpoints?: RenderCheckpoint[];
  /** Server-owned, explicitly approved soundtrack; never selected from client paths. */
  approvedAudioMaster?: import('@/engine/export/ExportCheckpoint').LockedExportAudio;
}
