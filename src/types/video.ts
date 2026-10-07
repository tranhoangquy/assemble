import type { AnimationAction } from './assembly';
import type { Vector3Tuple } from './product';
import type { VideoPresentationDefinition } from './presentation';
import type {ExplodedIntroDefinition} from '@/presentation/intro/definition';

export interface CameraPreset { position: Vector3Tuple; target: Vector3Tuple; fov?: number; /** Explicit access to an underside connection. */ allowUnderside?:boolean; }
export interface QuickActionDefinition { id: string; label: string; sceneId: string; primary?: boolean; }
export interface PartIntroduction { label: string; count: number; hardware?: string; duration?: number; }
export interface VideoScene {
  id: string;
  title: string;
  subtitle?: string;
  step?: string;
  duration: number;
  camera?: string;
  assemblyStep?: string;
  partIntro?: PartIntroduction;
  callouts?: string[];
  completionAt?: number;
  phase?: 'assembly' | 'showcase' | 'intro';
  actions: AnimationAction[];
}
export interface VideoDefinition {
  id: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  background: string;
  presentation?: VideoPresentationDefinition;
  intro?:ExplodedIntroDefinition;
  /** Editorial source windows; source mechanics are evaluated on their original clock. */
  editorial?: { source: VideoDefinition; segments: { sceneId: string; sourceIn: number; sourceOut: number }[] };
  captionLayout?: 'vertical-safe';
  cameraPresets: Record<string, CameraPreset>;
  quickActions?: QuickActionDefinition[];
  scenes: VideoScene[];
  audio?: { voiceover: string | null; music: string | null };
  presentationNames?: Record<string,string>;
  reviewCaptions?: { start: number; end: number; title: string; note: string; hidden?:boolean }[];
}
export interface ComputedScene extends VideoScene { index: number; start: number; end: number; }
