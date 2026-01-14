import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import {
  setPopulationData,
  setCurrentSampleIndices,
  addSampleMean,
  stopSimulation,
} from '../../../store/slices/samplingSlice';
import {
  generatePopulation,
  drawSampleIndices,
  mean,
} from '../../../utils/statistics';
import type { AnimationPhase, AnimatedDot } from './types';

const POPULATION_SIZE = 500;

/**
 * Hook to manage population data generation.
 * Regenerates population when distribution parameters change.
 */
export function usePopulation() {
  const dispatch = useDispatch<AppDispatch>();
  const { populationType, populationMean, populationStd, populationData } =
    useSelector((state: RootState) => state.sampling);

  useEffect(() => {
    const data = generatePopulation(
      populationType,
      populationMean,
      populationStd,
      POPULATION_SIZE
    );
    dispatch(setPopulationData(data));
  }, [dispatch, populationType, populationMean, populationStd]);

  return { populationData };
}

/**
 * Hook to manage the sampling animation.
 * Controls the animation phases and timing based on how many samples have been taken.
 */
export function useAnimation() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    populationData,
    sampleSize,
    numberOfSamples,
    animationSpeed,
    isRunning,
    samplesCompleted,
  } = useSelector((state: RootState) => state.sampling);

  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>({
    phase: 'complete',
    progress: 1,
  });
  const [animatedDots, setAnimatedDots] = useState<AnimatedDot[]>([]);
  const [targetMean, setTargetMean] = useState<number | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);

  const runSample = useCallback(() => {
    if (populationData.length === 0) return;

    // Draw sample
    const indices = drawSampleIndices(populationData.length, sampleSize);
    const sampleValues = indices.map((i) => populationData[i]);
    const sampleMean = mean(sampleValues);

    dispatch(setCurrentSampleIndices(indices));
    setTargetMean(sampleMean);

    // Initialize animated dots
    const dots: AnimatedDot[] = indices.map((index) => ({
      index,
      originalX: 0,
      originalY: 0,
      currentX: 0,
      currentY: 0,
      value: populationData[index],
    }));
    setAnimatedDots(dots);

    // Determine animation type based on how many samples completed
    if (samplesCompleted < 3) {
      // Full animation for first 3 samples
      setAnimationPhase({ phase: 'highlight', progress: 0 });
      phaseStartTimeRef.current = performance.now();
    } else if (samplesCompleted < 10) {
      // Quick animation
      setAnimationPhase({ phase: 'highlight', progress: 0 });
      phaseStartTimeRef.current = performance.now();
    } else {
      // Instant - just add the mean
      dispatch(addSampleMean(sampleMean));
      dispatch(setCurrentSampleIndices([]));
      setAnimatedDots([]);
      setTargetMean(null);
      // Ensure phase is marked complete for instant samples
      setAnimationPhase({ phase: 'complete', progress: 1 });
    }
  }, [populationData, sampleSize, samplesCompleted, numberOfSamples, dispatch]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || animationPhase.phase === 'complete') {
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - phaseStartTimeRef.current;

      // Determine phase durations based on sample count
      // Samples 1-3: slow (full animation), Samples 4-10: faster, Samples 11+: instant
      const isSlow = samplesCompleted < 3;
      const isFast = samplesCompleted >= 3 && samplesCompleted < 10;
      const highlightDuration = isSlow ? animationSpeed * 0.3 : isFast ? 80 : 0;
      const convergeDuration = isSlow ? animationSpeed * 0.4 : isFast ? 80 : 0;
      const dropDuration = isSlow ? animationSpeed * 0.3 : isFast ? 40 : 0;

      switch (animationPhase.phase) {
        case 'highlight':
          if (elapsed >= highlightDuration) {
            setAnimationPhase({ phase: 'converge', progress: 0 });
            phaseStartTimeRef.current = currentTime;
          } else {
            setAnimationPhase({
              phase: 'highlight',
              progress: elapsed / highlightDuration,
            });
          }
          break;

        case 'converge':
          if (elapsed >= convergeDuration) {
            setAnimationPhase({ phase: 'drop', progress: 0 });
            phaseStartTimeRef.current = currentTime;
          } else {
            setAnimationPhase({
              phase: 'converge',
              progress: elapsed / convergeDuration,
            });
          }
          break;

        case 'drop':
          if (elapsed >= dropDuration) {
            // Animation complete - add the sample mean
            if (targetMean !== null) {
              dispatch(addSampleMean(targetMean));
            }
            dispatch(setCurrentSampleIndices([]));
            setAnimatedDots([]);
            setTargetMean(null);
            setAnimationPhase({ phase: 'complete', progress: 1 });
          } else {
            setAnimationPhase({
              phase: 'drop',
              progress: elapsed / dropDuration,
            });
          }
          break;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isRunning,
    animationPhase.phase,
    samplesCompleted,
    animationSpeed,
    targetMean,
    dispatch,
  ]);

  // Trigger next sample when animation completes
  useEffect(() => {
    if (
      isRunning &&
      animationPhase.phase === 'complete' &&
      samplesCompleted < numberOfSamples
    ) {
      // Small delay before next sample (faster for instant mode)
      const delay = samplesCompleted < 10 ? 50 : 5;
      const timeout = setTimeout(runSample, delay);
      return () => clearTimeout(timeout);
    } else if (samplesCompleted >= numberOfSamples && isRunning) {
      dispatch(stopSimulation());
    }
  }, [
    isRunning,
    animationPhase.phase,
    samplesCompleted,
    numberOfSamples,
    runSample,
    dispatch,
  ]);

  // Start first sample when simulation starts
  useEffect(() => {
    if (isRunning && samplesCompleted === 0) {
      runSample();
    }
  }, [isRunning, samplesCompleted, runSample]);

  return {
    animationPhase,
    animatedDots,
    targetMean,
  };
}

/**
 * Hook to calculate statistics for display.
 */
export function useStatistics() {
  const { populationMean, populationStd, sampleSize, sampleMeans } =
    useSelector((state: RootState) => state.sampling);

  const theoreticalSE = populationStd / Math.sqrt(sampleSize);

  const observedMean = sampleMeans.length > 0 ? mean(sampleMeans) : null;

  const observedSE =
    sampleMeans.length > 1
      ? Math.sqrt(
          sampleMeans
            .map((m) => Math.pow(m - (observedMean ?? 0), 2))
            .reduce((a, b) => a + b, 0) /
            (sampleMeans.length - 1)
        )
      : null;

  return {
    populationMean,
    populationStd,
    theoreticalSE,
    observedMean,
    observedSE,
    sampleCount: sampleMeans.length,
  };
}
