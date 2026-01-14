import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PopulationType = 'normal' | 'uniform' | 'skewed' | 'custom';

export interface SamplingState {
  // Population parameters
  populationType: PopulationType;
  populationMean: number;
  populationStd: number;

  // Sampling parameters
  sampleSize: number;
  numberOfSamples: number;

  // Generated data
  populationData: number[];
  sampleMeans: number[];
  currentSampleIndices: number[];

  // Animation state
  animationSpeed: number;
  isRunning: boolean;
  samplesCompleted: number;
}

const initialState: SamplingState = {
  populationType: 'normal',
  populationMean: 50,
  populationStd: 15,
  sampleSize: 25,
  numberOfSamples: 200,
  populationData: [],
  sampleMeans: [],
  currentSampleIndices: [],
  animationSpeed: 500,
  isRunning: false,
  samplesCompleted: 0,
};

const samplingSlice = createSlice({
  name: 'sampling',
  initialState,
  reducers: {
    setPopulationType(state, action: PayloadAction<PopulationType>) {
      state.populationType = action.payload;
    },
    setPopulationMean(state, action: PayloadAction<number>) {
      state.populationMean = action.payload;
    },
    setPopulationStd(state, action: PayloadAction<number>) {
      state.populationStd = action.payload;
    },
    setSampleSize(state, action: PayloadAction<number>) {
      state.sampleSize = action.payload;
    },
    setNumberOfSamples(state, action: PayloadAction<number>) {
      state.numberOfSamples = action.payload;
    },
    setAnimationSpeed(state, action: PayloadAction<number>) {
      state.animationSpeed = action.payload;
    },
    setPopulationData(state, action: PayloadAction<number[]>) {
      state.populationData = action.payload;
    },
    setCurrentSampleIndices(state, action: PayloadAction<number[]>) {
      state.currentSampleIndices = action.payload;
    },
    addSampleMean(state, action: PayloadAction<number>) {
      state.sampleMeans.push(action.payload);
      state.samplesCompleted += 1;
    },
    startSimulation(state) {
      state.isRunning = true;
    },
    stopSimulation(state) {
      state.isRunning = false;
    },
    resetSimulation(state) {
      state.sampleMeans = [];
      state.currentSampleIndices = [];
      state.samplesCompleted = 0;
      state.isRunning = false;
    },
  },
});

export const {
  setPopulationType,
  setPopulationMean,
  setPopulationStd,
  setSampleSize,
  setNumberOfSamples,
  setAnimationSpeed,
  setPopulationData,
  setCurrentSampleIndices,
  addSampleMean,
  startSimulation,
  stopSimulation,
  resetSimulation,
} = samplingSlice.actions;

export default samplingSlice.reducer;
