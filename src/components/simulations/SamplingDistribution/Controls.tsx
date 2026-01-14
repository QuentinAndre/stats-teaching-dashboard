import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import {
  setPopulationType,
  setPopulationMean,
  setPopulationStd,
  setSampleSize,
  setNumberOfSamples,
  setAnimationSpeed,
  startSimulation,
  stopSimulation,
  resetSimulation,
  PopulationType,
} from '../../../store/slices/samplingSlice';
import { SAMPLE_SIZE_OPTIONS, NUM_SAMPLES_OPTIONS } from './types';

export default function Controls() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    populationType,
    populationMean,
    populationStd,
    sampleSize,
    numberOfSamples,
    animationSpeed,
    isRunning,
    samplesCompleted,
  } = useSelector((state: RootState) => state.sampling);

  const handlePopulationTypeChange = (type: PopulationType) => {
    dispatch(setPopulationType(type));
    dispatch(resetSimulation());
  };

  const handleStart = () => {
    if (samplesCompleted >= numberOfSamples) {
      dispatch(resetSimulation());
    }
    dispatch(startSimulation());
  };

  const handleStop = () => {
    dispatch(stopSimulation());
  };

  const handleReset = () => {
    dispatch(stopSimulation());
    dispatch(resetSimulation());
  };

  return (
    <div className="controls" role="group" aria-label="Simulation controls">
      {/* Population Shape */}
      <fieldset className="control-group">
        <legend>Population Shape</legend>
        <div className="radio-group">
          {(['normal', 'uniform', 'skewed', 'custom'] as PopulationType[]).map(
            (type) => (
              <label key={type} className="radio-label">
                <input
                  type="radio"
                  name="populationType"
                  value={type}
                  checked={populationType === type}
                  onChange={() => handlePopulationTypeChange(type)}
                  disabled={isRunning}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            )
          )}
        </div>
      </fieldset>

      {/* Population Parameters */}
      <fieldset className="control-group">
        <legend>Population Parameters</legend>
        <div className="slider-control">
          <label htmlFor="mean-slider">
            Mean (μ): <strong>{populationMean}</strong>
          </label>
          <input
            id="mean-slider"
            type="range"
            min="20"
            max="80"
            value={populationMean}
            onChange={(e) => {
              dispatch(setPopulationMean(Number(e.target.value)));
              dispatch(resetSimulation());
            }}
            disabled={isRunning}
            aria-valuemin={20}
            aria-valuemax={80}
            aria-valuenow={populationMean}
          />
        </div>
        <div className="slider-control">
          <label htmlFor="std-slider">
            Std Dev (σ): <strong>{populationStd}</strong>
          </label>
          <input
            id="std-slider"
            type="range"
            min="5"
            max="25"
            value={populationStd}
            onChange={(e) => {
              dispatch(setPopulationStd(Number(e.target.value)));
              dispatch(resetSimulation());
            }}
            disabled={isRunning}
            aria-valuemin={5}
            aria-valuemax={25}
            aria-valuenow={populationStd}
          />
        </div>
      </fieldset>

      {/* Sample Size */}
      <fieldset className="control-group">
        <legend>Sample Size (n)</legend>
        <div className="button-group">
          {SAMPLE_SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              className={`option-button ${sampleSize === n ? 'active' : ''}`}
              onClick={() => {
                dispatch(setSampleSize(n));
                dispatch(resetSimulation());
              }}
              disabled={isRunning}
              aria-pressed={sampleSize === n}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Number of Samples */}
      <fieldset className="control-group">
        <legend>Number of Samples</legend>
        <div className="button-group">
          {NUM_SAMPLES_OPTIONS.map((n) => (
            <button
              key={n}
              className={`option-button ${numberOfSamples === n ? 'active' : ''}`}
              onClick={() => {
                dispatch(setNumberOfSamples(n));
                dispatch(resetSimulation());
              }}
              disabled={isRunning}
              aria-pressed={numberOfSamples === n}
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Animation Speed */}
      <fieldset className="control-group">
        <legend>Animation Speed</legend>
        <div className="slider-control">
          <label htmlFor="speed-slider">
            {animationSpeed}ms per sample
          </label>
          <input
            id="speed-slider"
            type="range"
            min="100"
            max="1000"
            step="100"
            value={animationSpeed}
            onChange={(e) => dispatch(setAnimationSpeed(Number(e.target.value)))}
            aria-valuemin={100}
            aria-valuemax={1000}
            aria-valuenow={animationSpeed}
          />
          <div className="speed-labels">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="action-buttons">
        {!isRunning ? (
          <button
            className="primary-button"
            onClick={handleStart}
            aria-label={samplesCompleted > 0 ? 'Continue sampling' : 'Start sampling'}
          >
            {samplesCompleted > 0 && samplesCompleted < numberOfSamples
              ? 'Continue'
              : 'Start'}
          </button>
        ) : (
          <button
            className="secondary-button"
            onClick={handleStop}
            aria-label="Pause sampling"
          >
            Pause
          </button>
        )}
        <button
          className="reset-button"
          onClick={handleReset}
          disabled={samplesCompleted === 0}
          aria-label="Reset simulation"
        >
          Reset
        </button>
      </div>

      {/* Progress */}
      <div className="progress-display" aria-live="polite">
        <span>
          Samples: {samplesCompleted} / {numberOfSamples}
        </span>
        <progress
          value={samplesCompleted}
          max={numberOfSamples}
          aria-label="Sampling progress"
        />
      </div>
    </div>
  );
}
