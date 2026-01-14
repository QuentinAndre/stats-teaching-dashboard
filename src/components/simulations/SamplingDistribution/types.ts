export interface AnimationPhase {
  phase: 'highlight' | 'converge' | 'drop' | 'complete';
  progress: number; // 0 to 1
}

export interface AnimatedDot {
  index: number;
  originalX: number;
  originalY: number;
  currentX: number;
  currentY: number;
  value: number;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

export interface SimulationDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export const DEFAULT_DIMENSIONS: SimulationDimensions = {
  width: 800,
  height: 250,
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
};

export const SAMPLE_MEANS_DIMENSIONS: SimulationDimensions = {
  width: 800,
  height: 200,
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
};

// Rugplot constants
export const STICK_WIDTH = 2;
export const STICK_HEIGHT_RATIO = 0.6; // 60% of inner height

export const SAMPLE_SIZE_OPTIONS = [2, 5, 10, 25, 50, 100] as const;
export const NUM_SAMPLES_OPTIONS = [1, 10, 50, 200, 1000] as const;
