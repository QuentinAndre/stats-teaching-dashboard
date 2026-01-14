import jStat from 'jstat';
import type { PopulationType } from '../store/slices/samplingSlice';

// jStat types don't include inv method, but it exists at runtime
const jStatDist = jStat as unknown as {
  normal: { inv: (p: number, mean: number, std: number) => number; pdf: (x: number, mean: number, std: number) => number };
  uniform: { inv: (p: number, a: number, b: number) => number };
  gamma: { inv: (p: number, shape: number, scale: number) => number };
};

/**
 * Generates a deterministic population that perfectly approximates the theoretical distribution.
 * Uses the inverse CDF (quantile function) at evenly spaced probabilities.
 *
 * This ensures:
 * 1. The same population is generated every time (deterministic)
 * 2. The distribution perfectly matches the theoretical shape
 *
 * @param type - Distribution type: 'normal', 'uniform', 'skewed', or 'custom'
 * @param mean - Population mean (μ)
 * @param std - Population standard deviation (σ)
 * @param size - Number of data points to generate
 */
export function generatePopulation(
  type: PopulationType,
  mean: number,
  std: number,
  size: number = 500
): number[] {
  const data: number[] = [];

  // Generate evenly spaced quantiles from 1/(size+1) to size/(size+1)
  // This avoids 0 and 1 which would give -∞ and +∞ for unbounded distributions
  for (let i = 1; i <= size; i++) {
    const p = i / (size + 1); // Probability quantile
    let value: number;

    switch (type) {
      case 'normal':
        // Normal distribution: use inverse CDF
        value = jStatDist.normal.inv(p, mean, std);
        break;

      case 'uniform':
        // Uniform distribution: evenly spaced points
        // For uniform [a, b]: std = (b-a) / sqrt(12)
        const range = std * Math.sqrt(12);
        const a = mean - range / 2;
        const b = mean + range / 2;
        value = jStatDist.uniform.inv(p, a, b);
        break;

      case 'skewed':
        // Gamma distribution shifted to have specified mean
        // shape=2 gives moderate right skew
        const shape = 2;
        const scale = std / Math.sqrt(shape);
        const gammaMean = shape * scale;
        value = jStatDist.gamma.inv(p, shape, scale) + (mean - gammaMean);
        break;

      case 'custom':
        // Bimodal distribution: mixture of two normals
        // First half of points from left mode, second half from right mode
        if (i <= size / 2) {
          // Map first half to full quantile range for left mode
          const pLeft = (2 * i - 1) / size;
          value = jStatDist.normal.inv(pLeft, mean - std, std * 0.5);
        } else {
          // Map second half to full quantile range for right mode
          const pRight = (2 * (i - size / 2) - 1) / size;
          value = jStatDist.normal.inv(pRight, mean + std, std * 0.5);
        }
        break;

      default:
        value = jStatDist.normal.inv(p, mean, std);
    }

    data.push(value);
  }

  // Shuffle the data so sampling is still random
  // Use a seeded shuffle for consistency
  return shuffleWithSeed(data, 42);
}

/**
 * Shuffles an array deterministically using a seed.
 * Uses Fisher-Yates shuffle with a simple seeded random number generator.
 */
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;

  // Simple seeded random number generator (mulberry32)
  const seededRandom = () => {
    currentSeed = (currentSeed + 0x6D2B79F5) | 0;
    let t = currentSeed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Draws a random sample of indices from the population.
 * @param populationSize - Total population size
 * @param sampleSize - Number of items to sample
 */
export function drawSampleIndices(
  populationSize: number,
  sampleSize: number
): number[] {
  const indices: number[] = [];
  const available = Array.from({ length: populationSize }, (_, i) => i);

  for (let i = 0; i < sampleSize && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    indices.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return indices;
}

/**
 * Calculates the mean of an array of numbers.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @param values - Array of numbers
 * @param isSample - If true, uses n-1 (sample std); if false, uses n (population std)
 */
export function standardDeviation(
  values: number[],
  isSample: boolean = true
): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
  const divisor = isSample ? values.length - 1 : values.length;
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / divisor);
}

/**
 * Calculates the theoretical standard error of the mean.
 * SE = σ / √n
 */
export function standardError(populationStd: number, sampleSize: number): number {
  return populationStd / Math.sqrt(sampleSize);
}

/**
 * Generates the probability density function values for the theoretical
 * sampling distribution of the mean (which is normal by CLT).
 * @param populationMean - μ
 * @param populationStd - σ
 * @param sampleSize - n
 * @param xValues - Array of x values to evaluate
 */
export function samplingDistributionPDF(
  populationMean: number,
  populationStd: number,
  sampleSize: number,
  xValues: number[]
): number[] {
  const se = standardError(populationStd, sampleSize);
  return xValues.map((x) => jStat.normal.pdf(x, populationMean, se));
}

/**
 * Creates histogram bin data from an array of values.
 * @param values - Data values
 * @param binCount - Number of bins
 * @param min - Minimum value for binning
 * @param max - Maximum value for binning
 */
export function createHistogramBins(
  values: number[],
  binCount: number,
  min: number,
  max: number
): { x0: number; x1: number; count: number }[] {
  const binWidth = (max - min) / binCount;
  const bins: { x0: number; x1: number; count: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    bins.push({
      x0: min + i * binWidth,
      x1: min + (i + 1) * binWidth,
      count: 0,
    });
  }

  values.forEach((value) => {
    if (value >= min && value < max) {
      const binIndex = Math.floor((value - min) / binWidth);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].count++;
      }
    } else if (value === max) {
      bins[binCount - 1].count++;
    }
  });

  return bins;
}
