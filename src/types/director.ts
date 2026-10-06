import type { AnimationAction } from './assembly';

export type DirectorShotType =
  | 'ESTABLISHING'
  | 'INTRODUCE_PART'
  | 'SHOW_TARGET'
  | 'STAGE_PART'
  | 'ALIGN_CONNECTION'
  | 'INSERT_PART'
  | 'CONNECTION_MACRO'
  | 'INSTALL_HARDWARE'
  | 'TIGHTEN_HARDWARE'
  | 'VERIFY_CONNECTION'
  | 'PULL_BACK'
  | 'STEP_COMPLETE';

export interface DirectorShot {
  id: string;
  type: DirectorShotType;
  duration: number;
  camera?: string;
  transition?: 'cut' | 'move';
  movingParts?: string[];
  targets?: string[];
  hardware?: string[];
  note?: string;
  actions: AnimationAction[];
}

export interface DirectorStep {
  step: number;
  id: string;
  title: string;
  subtitle: string;
  pdfPage: number;
  parts: string[];
  hardwareLabel: string;
  shots: DirectorShot[];
}

export interface DirectorPlan {
  id: string;
  source: string;
  presentationReference: string;
  steps: DirectorStep[];
}
