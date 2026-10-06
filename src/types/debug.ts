export interface DebugSettings {
  grid: boolean;
  pivots: boolean;
  bounds: boolean;
  installPaths: boolean;
  connections: boolean;
  collisions: boolean;
}

export const defaultDebugSettings: DebugSettings = {
  grid: false,
  pivots: false,
  bounds: false,
  installPaths: false,
  connections: false,
  collisions: false,
};
