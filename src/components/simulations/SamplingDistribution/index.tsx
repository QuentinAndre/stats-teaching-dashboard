import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { usePopulation, useAnimation } from './hooks';
import PopulationDisplay from './PopulationDisplay';
import SamplingDisplay from './SamplingDisplay';
import Controls from './Controls';
import StatisticsPanel from './StatisticsPanel';

/**
 * SamplingDistribution Component
 *
 * Interactive demonstration of sampling distributions and the Central Limit Theorem.
 *
 * Educational Goals:
 * 1. Show the difference between population and sample
 * 2. Demonstrate how sample means distribute around the population mean
 * 3. Illustrate the CLT: sampling distribution becomes normal as n increases
 * 4. Show that SE = σ/√n describes the spread of sample means
 */
export default function SamplingDistribution() {
  // Initialize population data based on parameters
  usePopulation();

  // Handle sampling animation
  const { animationPhase, animatedDots, targetMean } = useAnimation();

  // Get population parameters for shared x-axis domain
  const { populationMean, populationStd } = useSelector(
    (state: RootState) => state.sampling
  );

  // Calculate shared x-axis domain for alignment between top and bottom displays
  const xDomain = useMemo(() => {
    const buffer = populationStd * 4;
    return {
      min: populationMean - buffer,
      max: populationMean + buffer,
    };
  }, [populationMean, populationStd]);

  return (
    <div className="sampling-distribution">
      <div className="simulation-container">
        <div className="visualization-stack">
          {/* Population Distribution (Top) */}
          <section className="visualization-section" aria-label="Population distribution">
            <PopulationDisplay
              animationPhase={animationPhase}
              animatedDots={animatedDots}
              targetMean={targetMean}
              xDomain={xDomain}
            />
          </section>

          {/* Sampling Distribution / Rugplot (Bottom) */}
          <section className="visualization-section" aria-label="Sampling distribution">
            <SamplingDisplay
              animationPhase={animationPhase}
              targetMean={targetMean}
              xDomain={xDomain}
            />
          </section>
        </div>

        <aside className="sidebar">
          <Controls />
          <StatisticsPanel />
        </aside>
      </div>

      {/* Educational Notes */}
      <section className="educational-notes" aria-label="Educational explanation">
        <h3>Key Concepts</h3>
        <ul>
          <li>
            <strong>Population vs Sample:</strong> The top histogram shows the entire
            population. Each sample is a subset of n values drawn randomly.
          </li>
          <li>
            <strong>Sample Mean (x̄):</strong> The average of each sample. Each vertical
            stick in the bottom rugplot represents one sample's mean.
          </li>
          <li>
            <strong>Sampling Distribution:</strong> The distribution of all possible
            sample means. The dashed curve shows the theoretical distribution.
          </li>
          <li>
            <strong>Central Limit Theorem:</strong> As sample size (n) increases, the
            sampling distribution approaches normal, regardless of the population shape.
          </li>
          <li>
            <strong>Standard Error (SE = σ/√n):</strong> The spread of the sampling
            distribution decreases as sample size increases.
          </li>
        </ul>
      </section>
    </div>
  );
}
