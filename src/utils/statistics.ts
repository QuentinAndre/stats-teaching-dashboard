import jStat from 'jstat';
import type { PopulationType } from '../store/slices/samplingSlice';

// jStat types don't include inv method, but it exists at runtime
const jStatDist = jStat as unknown as {
  normal: { inv: (p: number, mean: number, std: number) => number; pdf: (x: number, mean: number, std: number) => number };
  uniform: { inv: (p: number, a: number, b: number) => number };
  gamma: { inv: (p: number, shape: number, scale: number) => number };
  studentt: { cdf: (x: number, df: number) => number; pdf: (x: number, df: number) => number };
  centralF: { cdf: (x: number, df1: number, df2: number) => number; pdf: (x: number, df1: number, df2: number) => number };
};

/**
 * Returns the PDF of a t-distribution at value x with given degrees of freedom.
 * @param x - The value at which to evaluate the PDF
 * @param df - Degrees of freedom
 */
export function tDistributionPDF(x: number, df: number): number {
  return jStatDist.studentt.pdf(x, df);
}

/**
 * Returns the CDF of a t-distribution at value x with given degrees of freedom.
 * @param x - The value at which to evaluate the CDF
 * @param df - Degrees of freedom
 */
export function tDistributionCDF(x: number, df: number): number {
  return jStatDist.studentt.cdf(x, df);
}

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

/* ==========================================================================
   Outlier Detection Functions
   ========================================================================== */

export type OutlierMethod = 'iqr' | 'zscore' | 'mad';

/**
 * Computes the Interquartile Range (IQR) statistics for an array.
 * @param data - Array of numbers
 * @returns Object with q1, median, q3, and iqr values
 */
export function computeIQR(data: number[]): {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
} {
  if (data.length === 0) {
    return { q1: 0, median: 0, q3: 0, iqr: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const lowerHalf = sorted.slice(0, Math.floor(n / 2));
  const upperHalf = sorted.slice(Math.ceil(n / 2));

  const q1 = lowerHalf.length % 2 === 0
    ? (lowerHalf[lowerHalf.length / 2 - 1] + lowerHalf[lowerHalf.length / 2]) / 2
    : lowerHalf[Math.floor(lowerHalf.length / 2)];

  const q3 = upperHalf.length % 2 === 0
    ? (upperHalf[upperHalf.length / 2 - 1] + upperHalf[upperHalf.length / 2]) / 2
    : upperHalf[Math.floor(upperHalf.length / 2)];

  return {
    q1,
    median,
    q3,
    iqr: q3 - q1,
  };
}

/**
 * Identifies outliers using the IQR method.
 * Values outside [Q1 - k*IQR, Q3 + k*IQR] are flagged as outliers.
 * @param data - Array of numbers
 * @param multiplier - IQR multiplier (default 1.5 for standard, 3 for extreme)
 * @returns Array of indices that are outliers
 */
export function identifyOutliersIQR(
  data: number[],
  multiplier: number = 1.5
): number[] {
  const { q1, q3, iqr } = computeIQR(data);
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return data
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value < lowerBound || value > upperBound)
    .map(({ index }) => index);
}

/**
 * Gets the IQR thresholds for outlier detection.
 * @param data - Array of numbers
 * @param multiplier - IQR multiplier (default 1.5)
 * @returns Object with lower and upper bounds
 */
export function getIQRThresholds(
  data: number[],
  multiplier: number = 1.5
): { lower: number; upper: number } {
  const { q1, q3, iqr } = computeIQR(data);
  return {
    lower: q1 - multiplier * iqr,
    upper: q3 + multiplier * iqr,
  };
}

/**
 * Gets outlier thresholds using Median ± k*IQR.
 * This is a stricter rule than the standard boxplot method.
 * @param data - Array of numbers
 * @param multiplier - IQR multiplier (default 1.5)
 * @returns Object with lower and upper bounds
 */
export function getMedianIQRThresholds(
  data: number[],
  multiplier: number = 1.5
): { lower: number; upper: number } {
  const { median, iqr } = computeIQR(data);
  return {
    lower: median - multiplier * iqr,
    upper: median + multiplier * iqr,
  };
}

/**
 * Identifies outliers using Median ± k*IQR rule.
 * @param data - Array of numbers
 * @param multiplier - IQR multiplier (default 1.5)
 * @returns Array of indices that are outliers
 */
export function identifyOutliersMedianIQR(
  data: number[],
  multiplier: number = 1.5
): number[] {
  const { lower, upper } = getMedianIQRThresholds(data, multiplier);
  return data
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value < lower || value > upper)
    .map(({ index }) => index);
}

/**
 * Identifies outliers using the z-score method.
 * Values with |z| > threshold are flagged as outliers.
 * @param data - Array of numbers
 * @param threshold - z-score threshold (default 2.5)
 * @returns Array of indices that are outliers
 */
export function identifyOutliersZScore(
  data: number[],
  threshold: number = 2.5
): number[] {
  const avg = mean(data);
  const std = standardDeviation(data, false);

  if (std === 0) return [];

  return data
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => Math.abs((value - avg) / std) > threshold)
    .map(({ index }) => index);
}

/**
 * Gets the z-score thresholds for outlier detection.
 * @param data - Array of numbers
 * @param threshold - z-score threshold (default 2.5)
 * @returns Object with lower and upper bounds
 */
export function getZScoreThresholds(
  data: number[],
  threshold: number = 2.5
): { lower: number; upper: number } {
  const avg = mean(data);
  const std = standardDeviation(data, false);
  return {
    lower: avg - threshold * std,
    upper: avg + threshold * std,
  };
}

/**
 * Computes the Median Absolute Deviation (MAD).
 * MAD = median(|Xi - median(X)|)
 * @param data - Array of numbers
 * @returns MAD value
 */
export function computeMAD(data: number[]): number {
  if (data.length === 0) return 0;

  const { median } = computeIQR(data);
  const absoluteDeviations = data.map((v) => Math.abs(v - median));
  const { median: mad } = computeIQR(absoluteDeviations);

  return mad;
}

/**
 * Identifies outliers using the MAD method.
 * Values where |Xi - median| / (k * MAD) > threshold are flagged.
 * @param data - Array of numbers
 * @param threshold - Threshold (default 2.5)
 * @param k - Consistency constant for normal distribution (default 1.4826)
 * @returns Array of indices that are outliers
 */
export function identifyOutliersMAD(
  data: number[],
  threshold: number = 2.5,
  k: number = 1.4826
): number[] {
  const { median } = computeIQR(data);
  const mad = computeMAD(data);

  if (mad === 0) return [];

  const scaledMAD = k * mad;

  return data
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => Math.abs(value - median) / scaledMAD > threshold)
    .map(({ index }) => index);
}

/**
 * Gets the MAD thresholds for outlier detection.
 * @param data - Array of numbers
 * @param threshold - Threshold (default 2.5)
 * @param k - Consistency constant (default 1.4826)
 * @returns Object with lower and upper bounds
 */
export function getMADThresholds(
  data: number[],
  threshold: number = 2.5,
  k: number = 1.4826
): { lower: number; upper: number } {
  const { median } = computeIQR(data);
  const mad = computeMAD(data);
  const scaledMAD = k * mad;
  return {
    lower: median - threshold * scaledMAD,
    upper: median + threshold * scaledMAD,
  };
}

/**
 * Identifies outliers using a specified method.
 * @param data - Array of numbers
 * @param method - Outlier detection method
 * @param threshold - Method-specific threshold
 * @returns Array of indices that are outliers
 */
export function identifyOutliers(
  data: number[],
  method: OutlierMethod = 'iqr',
  threshold?: number
): number[] {
  switch (method) {
    case 'iqr':
      return identifyOutliersIQR(data, threshold ?? 1.5);
    case 'zscore':
      return identifyOutliersZScore(data, threshold ?? 2.5);
    case 'mad':
      return identifyOutliersMAD(data, threshold ?? 2.5);
    default:
      return identifyOutliersIQR(data, threshold ?? 1.5);
  }
}

/**
 * Gets outlier thresholds using a specified method.
 * @param data - Array of numbers
 * @param method - Outlier detection method
 * @param threshold - Method-specific threshold
 * @returns Object with lower and upper bounds
 */
export function getOutlierThresholds(
  data: number[],
  method: OutlierMethod = 'iqr',
  threshold?: number
): { lower: number; upper: number } {
  switch (method) {
    case 'iqr':
      return getIQRThresholds(data, threshold ?? 1.5);
    case 'zscore':
      return getZScoreThresholds(data, threshold ?? 2.5);
    case 'mad':
      return getMADThresholds(data, threshold ?? 2.5);
    default:
      return getIQRThresholds(data, threshold ?? 1.5);
  }
}

/* ==========================================================================
   Within vs Across Condition Outlier Detection
   ========================================================================== */

/**
 * Identifies outliers using within-condition thresholds.
 * Each group's thresholds are computed independently.
 * This can introduce bias when comparing conditions.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @param method - Outlier detection method
 * @param threshold - Method-specific threshold
 * @returns Tuple of outlier indices for each group
 */
export function getOutlierIndicesWithin(
  group1: number[],
  group2: number[],
  method: OutlierMethod = 'iqr',
  threshold?: number
): [number[], number[]] {
  return [
    identifyOutliers(group1, method, threshold),
    identifyOutliers(group2, method, threshold),
  ];
}

/**
 * Gets thresholds using within-condition computation.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @param method - Outlier detection method
 * @param threshold - Method-specific threshold
 * @returns Object with thresholds for each group
 */
export function getWithinThresholds(
  group1: number[],
  group2: number[],
  method: OutlierMethod = 'iqr',
  threshold?: number
): {
  group1: { lower: number; upper: number };
  group2: { lower: number; upper: number };
} {
  return {
    group1: getOutlierThresholds(group1, method, threshold),
    group2: getOutlierThresholds(group2, method, threshold),
  };
}

/**
 * Identifies outliers using across-condition thresholds.
 * Thresholds are computed from combined data, then applied to each group.
 * This is the recommended approach that avoids condition-dependent bias.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @param method - Outlier detection method
 * @param threshold - Method-specific threshold
 * @returns Tuple of outlier indices for each group
 */
export function getOutlierIndicesAcross(
  group1: number[],
  group2: number[],
  method: OutlierMethod = 'iqr',
  threshold?: number
): [number[], number[]] {
  const combined = [...group1, ...group2];
  const { lower, upper } = getOutlierThresholds(combined, method, threshold);

  const group1Outliers = group1
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value < lower || value > upper)
    .map(({ index }) => index);

  const group2Outliers = group2
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value < lower || value > upper)
    .map(({ index }) => index);

  return [group1Outliers, group2Outliers];
}

/**
 * Gets thresholds using across-condition computation.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @param method - Outlier detection method
 * @param threshold - Method-specific threshold
 * @returns Single threshold object (same for both groups)
 */
export function getAcrossThresholds(
  group1: number[],
  group2: number[],
  method: OutlierMethod = 'iqr',
  threshold?: number
): { lower: number; upper: number } {
  const combined = [...group1, ...group2];
  return getOutlierThresholds(combined, method, threshold);
}

/* ==========================================================================
   Median ± IQR Within/Across Functions (Stricter Rule)
   ========================================================================== */

/**
 * Identifies outliers using within-condition Median ± k*IQR thresholds.
 * Each group's thresholds are computed independently using its own median.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @param multiplier - IQR multiplier (default 1.5)
 * @returns Tuple of outlier indices for each group
 */
export function getOutlierIndicesWithinMedianIQR(
  group1: number[],
  group2: number[],
  multiplier: number = 1.5
): [number[], number[]] {
  return [
    identifyOutliersMedianIQR(group1, multiplier),
    identifyOutliersMedianIQR(group2, multiplier),
  ];
}

/**
 * Identifies outliers using across-condition Median ± k*IQR thresholds.
 * Thresholds are computed from combined data's median, then applied to each group.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @param multiplier - IQR multiplier (default 1.5)
 * @returns Tuple of outlier indices for each group
 */
export function getOutlierIndicesAcrossMedianIQR(
  group1: number[],
  group2: number[],
  multiplier: number = 1.5
): [number[], number[]] {
  const combined = [...group1, ...group2];
  const { lower, upper } = getMedianIQRThresholds(combined, multiplier);

  const group1Outliers = group1
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value < lower || value > upper)
    .map(({ index }) => index);

  const group2Outliers = group2
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value < lower || value > upper)
    .map(({ index }) => index);

  return [group1Outliers, group2Outliers];
}

/* ==========================================================================
   Statistical Tests
   ========================================================================== */

/**
 * Performs a Welch's t-test (unequal variances t-test).
 * Tests whether two groups have different means.
 * @param group1 - First group data
 * @param group2 - Second group data
 * @returns Object with t-statistic, degrees of freedom, and p-value
 */
export function welchTTest(
  group1: number[],
  group2: number[]
): { t: number; df: number; p: number } {
  const n1 = group1.length;
  const n2 = group2.length;

  if (n1 < 2 || n2 < 2) {
    return { t: 0, df: 0, p: 1 };
  }

  const mean1 = mean(group1);
  const mean2 = mean(group2);
  const var1 = Math.pow(standardDeviation(group1, true), 2);
  const var2 = Math.pow(standardDeviation(group2, true), 2);

  const se1 = var1 / n1;
  const se2 = var2 / n2;

  const t = (mean1 - mean2) / Math.sqrt(se1 + se2);

  // Welch-Satterthwaite degrees of freedom
  const df =
    Math.pow(se1 + se2, 2) /
    (Math.pow(se1, 2) / (n1 - 1) + Math.pow(se2, 2) / (n2 - 1));

  // Two-tailed p-value using t-distribution
  const p = 2 * (1 - jStatDist.studentt.cdf(Math.abs(t), df));

  return { t, df, p };
}

/**
 * Generates random samples from a normal distribution.
 * @param n - Sample size
 * @param mean - Population mean
 * @param std - Population standard deviation
 * @returns Array of n random values
 */
export function generateNormalSample(
  n: number,
  mean: number = 0,
  std: number = 1
): number[] {
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller transform for generating normal random variables
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    values.push(mean + std * z);
  }
  return values;
}

/**
 * Removes elements at specified indices from an array.
 * @param data - Original array
 * @param indices - Indices to remove
 * @returns New array with elements removed
 */
export function removeAtIndices<T>(data: T[], indices: number[]): T[] {
  const indexSet = new Set(indices);
  return data.filter((_, i) => !indexSet.has(i));
}

/* ==========================================================================
   ANOVA Functions
   ========================================================================== */

/**
 * Returns the PDF of an F-distribution at value x with given degrees of freedom.
 * @param x - The value at which to evaluate the PDF (must be >= 0)
 * @param df1 - Numerator degrees of freedom (between-groups)
 * @param df2 - Denominator degrees of freedom (within-groups)
 */
export function fDistributionPDF(x: number, df1: number, df2: number): number {
  if (x < 0) return 0;
  return jStatDist.centralF.pdf(x, df1, df2);
}

/**
 * Returns the CDF of an F-distribution at value x with given degrees of freedom.
 * @param x - The value at which to evaluate the CDF
 * @param df1 - Numerator degrees of freedom (between-groups)
 * @param df2 - Denominator degrees of freedom (within-groups)
 */
export function fDistributionCDF(x: number, df1: number, df2: number): number {
  if (x < 0) return 0;
  return jStatDist.centralF.cdf(x, df1, df2);
}

/**
 * Calculates group statistics for ANOVA.
 * @param groups - Array of arrays, each containing observations for one group
 * @returns Object with means, variances, sample sizes, grand mean, and total N
 */
export function calculateGroupStatistics(groups: number[][]): {
  means: number[];
  variances: number[];
  sds: number[];
  ns: number[];
  grandMean: number;
  totalN: number;
} {
  const means = groups.map((g) => mean(g));
  const variances = groups.map((g) => {
    if (g.length <= 1) return 0;
    const m = mean(g);
    return g.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (g.length - 1);
  });
  const sds = variances.map((v) => Math.sqrt(v));
  const ns = groups.map((g) => g.length);
  const totalN = ns.reduce((a, b) => a + b, 0);

  // Grand mean: weighted average of group means, or mean of all data
  const allData = groups.flat();
  const grandMean = mean(allData);

  return { means, variances, sds, ns, grandMean, totalN };
}

/**
 * Computes sum of squares for ANOVA.
 * SS_Total = SS_Between + SS_Within (always)
 *
 * SS_Total: Sum of squared deviations of all observations from the grand mean
 * SS_Between: Sum of squared deviations of group means from grand mean, weighted by n
 * SS_Within: Sum of squared deviations of observations from their group means
 *
 * @param groups - Array of arrays, each containing observations for one group
 * @returns Object with ssTotal, ssBetween, and ssWithin
 */
export function computeSumOfSquares(groups: number[][]): {
  ssTotal: number;
  ssBetween: number;
  ssWithin: number;
} {
  const { means, grandMean, ns } = calculateGroupStatistics(groups);
  const allData = groups.flat();

  // SS_Total: deviation of each observation from grand mean
  const ssTotal = allData.reduce((sum, x) => sum + Math.pow(x - grandMean, 2), 0);

  // SS_Between: weighted sum of squared deviations of group means from grand mean
  // SS_B = Σ n_j * (X̄_j - X̄..)²
  const ssBetween = groups.reduce((sum, _group, j) => {
    return sum + ns[j] * Math.pow(means[j] - grandMean, 2);
  }, 0);

  // SS_Within: sum of squared deviations within each group
  // SS_W = Σ Σ (X_ij - X̄_j)²
  const ssWithin = groups.reduce((sum, group, j) => {
    return sum + group.reduce((gSum, x) => gSum + Math.pow(x - means[j], 2), 0);
  }, 0);

  return { ssTotal, ssBetween, ssWithin };
}

/**
 * Performs one-way ANOVA.
 * Tests whether at least one group mean differs from the others.
 *
 * @param groups - Array of arrays, each containing observations for one group
 * @returns Full ANOVA table: SS, df, MS, F, and p-value
 */
export function oneWayANOVA(groups: number[][]): {
  ssTotal: number;
  ssBetween: number;
  ssWithin: number;
  dfBetween: number;
  dfWithin: number;
  dfTotal: number;
  msBetween: number;
  msWithin: number;
  fStatistic: number;
  pValue: number;
} {
  const k = groups.length; // number of groups
  const { totalN } = calculateGroupStatistics(groups);
  const { ssTotal, ssBetween, ssWithin } = computeSumOfSquares(groups);

  // Degrees of freedom
  const dfBetween = k - 1;
  const dfWithin = totalN - k;
  const dfTotal = totalN - 1;

  // Mean squares
  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  // F-statistic
  const fStatistic = msWithin > 0 ? msBetween / msWithin : 0;

  // P-value (right-tailed test)
  const pValue = dfBetween > 0 && dfWithin > 0
    ? 1 - fDistributionCDF(fStatistic, dfBetween, dfWithin)
    : 1;

  return {
    ssTotal,
    ssBetween,
    ssWithin,
    dfBetween,
    dfWithin,
    dfTotal,
    msBetween,
    msWithin,
    fStatistic,
    pValue,
  };
}

/**
 * Generates multiple groups of normally distributed data.
 * Useful for ANOVA demonstrations.
 *
 * @param groupMeans - Array of means for each group
 * @param groupSDs - Array of standard deviations for each group (or single value for all)
 * @param groupNs - Array of sample sizes for each group (or single value for all)
 * @returns Array of arrays containing the generated data
 */
export function generateANOVAData(
  groupMeans: number[],
  groupSDs: number | number[],
  groupNs: number | number[]
): number[][] {
  const k = groupMeans.length;
  const sds = typeof groupSDs === 'number' ? Array(k).fill(groupSDs) : groupSDs;
  const ns = typeof groupNs === 'number' ? Array(k).fill(groupNs) : groupNs;

  return groupMeans.map((groupMean, i) => generateNormalSample(ns[i], groupMean, sds[i]));
}

/* ==========================================================================
   P-Hacking Utility Functions
   ========================================================================== */

/**
 * Computes residuals after regressing Y on X (covariate adjustment).
 * Residuals = Y - (a + b*X) where b = cov(X,Y)/var(X) and a = mean(Y) - b*mean(X)
 * @param y - Dependent variable values
 * @param x - Covariate values
 * @returns Array of residuals
 */
export function getResiduals(y: number[], x: number[]): number[] {
  if (y.length !== x.length || y.length < 2) {
    return y;
  }

  const meanY = mean(y);
  const meanX = mean(x);
  const n = y.length;

  // Compute covariance and variance
  let cov = 0;
  let varX = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
  }

  // Avoid division by zero
  if (varX === 0) {
    return y.map((yi) => yi - meanY);
  }

  const b = cov / varX;
  const a = meanY - b * meanX;

  // Compute residuals
  return y.map((yi, i) => yi - (a + b * x[i]));
}

/**
 * Generates a random covariate (normally distributed).
 * Used to simulate adding a covariate in p-hacking scenarios.
 * @param n - Sample size
 * @param mean - Mean of the covariate (default 0)
 * @param sd - Standard deviation (default 1)
 * @returns Array of covariate values
 */
export function generateRandomCovariate(
  n: number,
  mean: number = 0,
  sd: number = 1
): number[] {
  return generateNormalSample(n, mean, sd);
}

/**
 * Applies log transformation to data with floor for zeros/negatives.
 * Adds a constant (min + 1) if needed to make all values positive.
 * @param data - Array of values to transform
 * @returns Log-transformed values
 */
export function logTransform(data: number[]): number[] {
  const minVal = Math.min(...data);
  // If minimum is <= 0, shift all values to be positive
  const shift = minVal <= 0 ? Math.abs(minVal) + 1 : 0;
  return data.map((v) => Math.log(v + shift));
}

/**
 * Generates random binary grouping (e.g., simulated gender).
 * @param n - Sample size
 * @param proportion - Proportion assigned to group 1 (default 0.5)
 * @returns Array of boolean values (true = group 1, false = group 2)
 */
export function generateBinaryGrouping(
  n: number,
  proportion: number = 0.5
): boolean[] {
  return Array.from({ length: n }, () => Math.random() < proportion);
}

/**
 * Generates a second variable correlated with the first at a specified correlation.
 * Uses the formula: y = r*x_standardized + sqrt(1-r^2)*noise, then rescale.
 * @param original - The original variable
 * @param correlation - Target correlation (e.g., 0.6)
 * @param targetMean - Mean of the correlated variable (default: same as original)
 * @param targetSD - SD of the correlated variable (default: same as original)
 * @returns Array correlated with the original at approximately the specified r
 */
export function generateCorrelatedVariable(
  original: number[],
  correlation: number,
  targetMean?: number,
  targetSD?: number
): number[] {
  const n = original.length;
  const origMean = mean(original);
  const origSD = standardDeviation(original, false);

  // Standardize original
  const xStd = original.map((v) => (origSD > 0 ? (v - origMean) / origSD : 0));

  // Generate independent noise
  const noise = generateNormalSample(n, 0, 1);

  // Combine: y_std = r * x_std + sqrt(1 - r^2) * noise
  const r = Math.max(-1, Math.min(1, correlation)); // Clamp correlation
  const sqrtOneMinusR2 = Math.sqrt(1 - r * r);
  const yStd = xStd.map((x, i) => r * x + sqrtOneMinusR2 * noise[i]);

  // Rescale to target mean and SD
  const finalMean = targetMean !== undefined ? targetMean : origMean;
  const finalSD = targetSD !== undefined ? targetSD : origSD;

  return yStd.map((y) => y * finalSD + finalMean);
}

/**
 * Options for running a p-hacking trial.
 */
export interface PHackingOptions {
  group1: number[];
  group2: number[];
  removeOutliers?: boolean;
  addCovariate?: boolean;
  covariate1?: number[];
  covariate2?: number[];
  splitByGender?: boolean;
  gender1?: boolean[];
  gender2?: boolean[];
  logTransform?: boolean;
}

/**
 * Result from a p-hacking trial.
 */
export interface PHackingTrialResult {
  pValues: number[];
  minP: number;
  analyses: string[];
  significant: boolean;
}

/**
 * Runs a single p-hacking trial, applying selected researcher degrees of freedom.
 * Returns all p-values tried and the minimum.
 * @param options - Configuration for which degrees of freedom to exploit
 * @returns Object with all p-values, minimum p, and analysis descriptions
 */
export function runPHackingTrial(options: PHackingOptions): PHackingTrialResult {
  const pValues: number[] = [];
  const analyses: string[] = [];
  let { group1, group2 } = options;

  // Helper function to run t-test and record result
  const runAndRecord = (g1: number[], g2: number[], label: string) => {
    if (g1.length >= 2 && g2.length >= 2) {
      const result = welchTTest(g1, g2);
      pValues.push(result.p);
      analyses.push(label);
    }
  };

  // 1. Basic analysis (always included)
  runAndRecord(group1, group2, 'Basic analysis');

  // 2. Remove outliers (±2.5 SD from overall mean)
  if (options.removeOutliers) {
    const combined = [...group1, ...group2];
    const m = mean(combined);
    const sd = standardDeviation(combined, false);
    const lower = m - 2.5 * sd;
    const upper = m + 2.5 * sd;

    const filtered1 = group1.filter((v) => v >= lower && v <= upper);
    const filtered2 = group2.filter((v) => v >= lower && v <= upper);
    runAndRecord(filtered1, filtered2, 'Outliers removed');

    // Update for subsequent analyses
    group1 = filtered1;
    group2 = filtered2;
  }

  // 3. Add covariate (residualize)
  if (options.addCovariate && options.covariate1 && options.covariate2) {
    const residuals1 = getResiduals(group1, options.covariate1.slice(0, group1.length));
    const residuals2 = getResiduals(group2, options.covariate2.slice(0, group2.length));
    runAndRecord(residuals1, residuals2, 'Covariate controlled');
  }

  // 4. Split by gender (report whichever subgroup is significant)
  if (options.splitByGender && options.gender1 && options.gender2) {
    // Males only
    const males1 = group1.filter((_, i) => options.gender1![i]);
    const males2 = group2.filter((_, i) => options.gender2![i]);
    runAndRecord(males1, males2, 'Males only');

    // Females only
    const females1 = group1.filter((_, i) => !options.gender1![i]);
    const females2 = group2.filter((_, i) => !options.gender2![i]);
    runAndRecord(females1, females2, 'Females only');
  }

  // 5. Log transform DV
  if (options.logTransform) {
    const log1 = logTransform(group1);
    const log2 = logTransform(group2);
    runAndRecord(log1, log2, 'Log-transformed');
  }

  const minP = Math.min(...pValues);

  return {
    pValues,
    minP,
    analyses,
    significant: minP < 0.05,
  };
}

/* ==========================================================================
   Within-Subjects / Repeated Measures Functions
   ========================================================================== */

/**
 * Performs a paired t-test (dependent samples t-test).
 * Tests whether the mean difference between paired observations is zero.
 *
 * The paired t-test is equivalent to a one-sample t-test on the difference scores.
 * t = D̄ / (s_D / √n)
 *
 * @param group1 - First set of paired observations
 * @param group2 - Second set of paired observations (same subjects)
 * @returns Object with t-statistic, degrees of freedom, p-value, mean difference, and SE
 */
export function pairedTTest(
  group1: number[],
  group2: number[]
): {
  t: number;
  df: number;
  p: number;
  meanDiff: number;
  seDiff: number;
} {
  if (group1.length !== group2.length) {
    throw new Error('Paired t-test requires equal-length arrays');
  }

  const n = group1.length;
  if (n < 2) {
    return { t: 0, df: 0, p: 1, meanDiff: 0, seDiff: 0 };
  }

  // Calculate difference scores: D = group2 - group1
  const differences = group1.map((val, i) => group2[i] - val);

  // Mean of differences
  const meanDiff = mean(differences);

  // Standard deviation of differences
  const sdDiff = standardDeviation(differences, true);

  // Standard error of the mean difference
  const seDiff = sdDiff / Math.sqrt(n);

  // t-statistic: H₀ is that μ_D = 0
  const t = seDiff > 0 ? meanDiff / seDiff : 0;

  // Degrees of freedom
  const df = n - 1;

  // Two-tailed p-value
  const p = 2 * (1 - jStatDist.studentt.cdf(Math.abs(t), df));

  return { t, df, p, meanDiff, seDiff };
}

/**
 * Performs one-way repeated measures ANOVA.
 * Tests whether condition means differ when the same subjects are measured
 * under multiple conditions.
 *
 * Variance partition:
 * SS_T = SS_A (conditions) + SS_S (subjects) + SS_A×S (residual/error)
 *
 * The error term (SS_A×S) represents inconsistency in how subjects respond
 * across conditions—typically much smaller than SS_Within in between-subjects designs.
 *
 * @param data - 2D array where data[subject][condition] = score
 * @returns Full RM-ANOVA table: SS, df, MS, F, and p-value
 */
export function repeatedMeasuresANOVA(data: number[][]): {
  ssTotal: number;
  ssSubjects: number;
  ssConditions: number;
  ssResidual: number;
  dfSubjects: number;
  dfConditions: number;
  dfResidual: number;
  msConditions: number;
  msResidual: number;
  F: number;
  p: number;
  grandMean: number;
  subjectMeans: number[];
  conditionMeans: number[];
} {
  const nSubjects = data.length;
  const nConditions = data[0]?.length || 0;

  if (nSubjects < 2 || nConditions < 2) {
    return {
      ssTotal: 0,
      ssSubjects: 0,
      ssConditions: 0,
      ssResidual: 0,
      dfSubjects: 0,
      dfConditions: 0,
      dfResidual: 0,
      msConditions: 0,
      msResidual: 0,
      F: 0,
      p: 1,
      grandMean: 0,
      subjectMeans: [],
      conditionMeans: [],
    };
  }

  // Flatten all data to calculate grand mean
  const allScores = data.flat();
  const grandMean = mean(allScores);

  // Calculate subject means (row means)
  const subjectMeans = data.map((subjectScores) => mean(subjectScores));

  // Calculate condition means (column means)
  const conditionMeans: number[] = [];
  for (let c = 0; c < nConditions; c++) {
    const conditionScores = data.map((subject) => subject[c]);
    conditionMeans.push(mean(conditionScores));
  }

  // SS_Total: total variation around grand mean
  let ssTotal = 0;
  for (const subject of data) {
    for (const score of subject) {
      ssTotal += Math.pow(score - grandMean, 2);
    }
  }

  // SS_Subjects: variation between subjects (averaged across conditions)
  // SS_S = nConditions * Σ(Ȳ_s - Ȳ_T)²
  let ssSubjects = 0;
  for (const subjectMean of subjectMeans) {
    ssSubjects += nConditions * Math.pow(subjectMean - grandMean, 2);
  }

  // SS_Conditions: variation between conditions (averaged across subjects)
  // SS_A = nSubjects * Σ(Ȳ_a - Ȳ_T)²
  let ssConditions = 0;
  for (const conditionMean of conditionMeans) {
    ssConditions += nSubjects * Math.pow(conditionMean - grandMean, 2);
  }

  // SS_Residual (SS_A×S): what's left after removing subject and condition effects
  // SS_A×S = SS_T - SS_S - SS_A
  // This represents the subject × condition interaction (inconsistency)
  const ssResidual = ssTotal - ssSubjects - ssConditions;

  // Degrees of freedom
  const dfSubjects = nSubjects - 1;
  const dfConditions = nConditions - 1;
  const dfResidual = dfSubjects * dfConditions;

  // Mean squares
  const msConditions = dfConditions > 0 ? ssConditions / dfConditions : 0;
  const msResidual = dfResidual > 0 ? ssResidual / dfResidual : 0;

  // F-statistic: MS_A / MS_A×S
  const F = msResidual > 0 ? msConditions / msResidual : 0;

  // P-value
  const p =
    dfConditions > 0 && dfResidual > 0
      ? 1 - fDistributionCDF(F, dfConditions, dfResidual)
      : 1;

  return {
    ssTotal,
    ssSubjects,
    ssConditions,
    ssResidual,
    dfSubjects,
    dfConditions,
    dfResidual,
    msConditions,
    msResidual,
    F,
    p,
    grandMean,
    subjectMeans,
    conditionMeans,
  };
}

/**
 * Generates within-subjects data with subject effects.
 * Each subject has a baseline (random intercept) plus condition effects plus noise.
 *
 * Model: Y_ij = μ_j + b_i + ε_ij
 * where:
 * - μ_j is the condition mean
 * - b_i ~ N(0, subjectSD) is the subject's baseline deviation
 * - ε_ij ~ N(0, errorSD) is random error
 *
 * @param nSubjects - Number of subjects
 * @param conditionMeans - Array of means for each condition
 * @param subjectSD - Standard deviation of subject random effects (individual differences)
 * @param errorSD - Standard deviation of residual error (within-subject noise)
 * @returns 2D array where result[subject][condition] = score
 */
export function generateWithinSubjectsData(
  nSubjects: number,
  conditionMeans: number[],
  subjectSD: number,
  errorSD: number
): number[][] {
  const nConditions = conditionMeans.length;
  const data: number[][] = [];

  for (let s = 0; s < nSubjects; s++) {
    // Generate subject-level random effect (baseline)
    const subjectEffect = generateNormalSample(1, 0, subjectSD)[0];

    const subjectScores: number[] = [];
    for (let c = 0; c < nConditions; c++) {
      // Score = condition mean + subject baseline + random error
      const error = generateNormalSample(1, 0, errorSD)[0];
      const score = conditionMeans[c] + subjectEffect + error;
      subjectScores.push(score);
    }
    data.push(subjectScores);
  }

  return data;
}
