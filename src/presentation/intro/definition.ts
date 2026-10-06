import type {Vector3Tuple} from '@/types/product';
/** Separate editorial prefix. Never an AssemblyGraph/PDF step. */
export interface ExplodedIntroDefinition {
  duration:number;
  heroDuration:number;
  separationDuration:number;
  holdDuration:number;
  transitionDuration:number;
  /** Source is a forward evaluated, approved completed-product pose. */
  assembledTime:number;
  explodedEnvironmentTime:number;
  heroCamera:string;
  explodedCamera:string;
  groups:{id:string;targets:string[];worldOffset:Vector3Tuple}[];
  hiddenTargets:string[];
}
export function introPhase(config:ExplodedIntroDefinition,time:number){
  const separationEnd=config.heroDuration+config.separationDuration;
  const transitionStart=separationEnd+config.holdDuration;
  const u=Math.max(0,Math.min(1,(time-config.heroDuration)/config.separationDuration));
  return {hero:time<config.heroDuration,transition:time>=transitionStart,
    separation:u*u*(3-2*u)};
}
