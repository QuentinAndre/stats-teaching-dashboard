import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { generatePopulation, drawSampleIndices, mean } from '../../../utils/statistics';

interface SkewedSamplingSectionProps {
  sampleSize?: number;
  numberOfSamples?: number;
}

// Population parameters for skewed distribution (same mean and SD as normal)
const POPULATION_SIZE = 500;
const POPULATION_MEAN = 50;
const POPULATION_STD = 10;

// Animation phases
type AnimationPhase = 'idle' | 'highlight' | 'converge' | 'drop' | 'complete';

interface AnimationState {
  phase: AnimationPhase;
  progress: number;
  currentSampleIndices: number[];
  targetMean: number | null;
}

export default function SkewedSamplingSection({
  sampleSize = 15,
  numberOfSamples = 500,
}: SkewedSamplingSectionProps) {
  const topSvgRef = useRef<SVGSVGElement>(null);
  const bottomSvgRef = useRef<SVGSVGElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);

  // State
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>({
    phase: 'idle',
    progress: 0,
    currentSampleIndices: [],
    targetMean: null,
  });

  // Generate SKEWED population data once (same mean and SD as the normal distribution)
  const populationData = useMemo(() => {
    return generatePopulation('skewed', POPULATION_MEAN, POPULATION_STD, POPULATION_SIZE);
  }, []);

  // X-axis domain (shared between top and bottom) - same as normal distribution for comparison
  const xDomain = useMemo(() => {
    const buffer = POPULATION_STD * 4;
    return { min: POPULATION_MEAN - buffer, max: POPULATION_MEAN + buffer };
  }, []);

  // Dimensions
  const width = 700;
  const topHeight = 200;
  const bottomHeight = 180;
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const topInnerHeight = topHeight - margin.top - margin.bottom;
  const bottomInnerHeight = bottomHeight - margin.top - margin.bottom;

  // Scales
  const xScale = useMemo(
    () => d3.scaleLinear().domain([xDomain.min, xDomain.max]).range([0, innerWidth]),
    [xDomain, innerWidth]
  );

  // Dot positions for population histogram
  const dotPositions = useMemo(() => {
    const binWidth = (xDomain.max - xDomain.min) / 50;
    const dotRadius = 2;
    const dotsPerRow = Math.floor((innerWidth / 50 - 2) / (dotRadius * 2));

    const binIndices: number[][] = Array.from({ length: 50 }, () => []);
    populationData.forEach((value, index) => {
      if (value >= xDomain.min && value < xDomain.max) {
        const binIndex = Math.floor((value - xDomain.min) / binWidth);
        if (binIndex >= 0 && binIndex < 50) {
          binIndices[binIndex].push(index);
        }
      }
    });

    const positions: { index: number; x: number; y: number; value: number }[] = [];
    binIndices.forEach((indices, binIdx) => {
      const binX = xScale(xDomain.min + (binIdx + 0.5) * binWidth);
      indices.forEach((dataIndex, posInBin) => {
        const row = Math.floor(posInBin / dotsPerRow);
        const col = posInBin % dotsPerRow;
        const x = binX + (col - dotsPerRow / 2) * dotRadius * 2;
        const y = topInnerHeight - (row + 1) * dotRadius * 2;
        positions.push({ index: dataIndex, x, y, value: populationData[dataIndex] });
      });
    });
    return positions;
  }, [populationData, xDomain, innerWidth, topInnerHeight, xScale]);

  // Run a single sample
  const runSample = useCallback(() => {
    if (sampleMeans.length >= numberOfSamples) {
      setIsRunning(false);
      return;
    }

    const indices = drawSampleIndices(populationData.length, sampleSize);
    const sampleValues = indices.map((i) => populationData[i]);
    const sampleMean = mean(sampleValues);

    const samplesCompleted = sampleMeans.length;

    // Determine if we should animate or go instant
    if (samplesCompleted < 3) {
      // Slow animation for first 3
      setAnimationState({
        phase: 'highlight',
        progress: 0,
        currentSampleIndices: indices,
        targetMean: sampleMean,
      });
      phaseStartTimeRef.current = performance.now();
    } else if (samplesCompleted < 10) {
      // Fast animation for samples 4-10
      setAnimationState({
        phase: 'highlight',
        progress: 0,
        currentSampleIndices: indices,
        targetMean: sampleMean,
      });
      phaseStartTimeRef.current = performance.now();
    } else {
      // Instant for samples 11+
      setSampleMeans((prev) => [...prev, sampleMean]);
      // Set phase to 'complete' so the useEffect triggers the next sample
      setAnimationState({
        phase: 'complete',
        progress: 1,
        currentSampleIndices: [],
        targetMean: null,
      });
    }
  }, [populationData, sampleSize, sampleMeans.length, numberOfSamples]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || animationState.phase === 'idle' || animationState.phase === 'complete') {
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - phaseStartTimeRef.current;
      const samplesCompleted = sampleMeans.length;

      // Determine phase durations
      const isSlow = samplesCompleted < 3;
      const highlightDuration = isSlow ? 400 : 80;
      const convergeDuration = isSlow ? 500 : 80;
      const dropDuration = isSlow ? 300 : 40;

      switch (animationState.phase) {
        case 'highlight':
          if (elapsed >= highlightDuration) {
            setAnimationState((prev) => ({ ...prev, phase: 'converge', progress: 0 }));
            phaseStartTimeRef.current = currentTime;
          } else {
            setAnimationState((prev) => ({
              ...prev,
              progress: elapsed / highlightDuration,
            }));
          }
          break;

        case 'converge':
          if (elapsed >= convergeDuration) {
            setAnimationState((prev) => ({ ...prev, phase: 'drop', progress: 0 }));
            phaseStartTimeRef.current = currentTime;
          } else {
            setAnimationState((prev) => ({
              ...prev,
              progress: elapsed / convergeDuration,
            }));
          }
          break;

        case 'drop':
          if (elapsed >= dropDuration) {
            // Animation complete - add the sample mean
            if (animationState.targetMean !== null) {
              setSampleMeans((prev) => [...prev, animationState.targetMean!]);
            }
            setAnimationState({
              phase: 'complete',
              progress: 1,
              currentSampleIndices: [],
              targetMean: null,
            });
          } else {
            setAnimationState((prev) => ({
              ...prev,
              progress: elapsed / dropDuration,
            }));
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
  }, [isRunning, animationState.phase, animationState.targetMean, sampleMeans.length]);

  // Trigger next sample when animation completes, or stop when done
  useEffect(() => {
    if (isRunning && animationState.phase === 'complete') {
      if (sampleMeans.length < numberOfSamples) {
        const delay = sampleMeans.length < 10 ? 100 : 5;
        const timeout = setTimeout(runSample, delay);
        return () => clearTimeout(timeout);
      } else {
        // We've reached the target, stop the simulation
        setIsRunning(false);
      }
    }
  }, [isRunning, animationState.phase, sampleMeans.length, numberOfSamples, runSample]);

  // Draw top histogram (bimodal population)
  useEffect(() => {
    if (!topSvgRef.current || dotPositions.length === 0) return;

    const svg = d3.select(topSvgRef.current);
    const g = svg.select<SVGGElement>('.population-content');
    g.selectAll('*').remove();

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${topInnerHeight})`)
      .call(xAxis);

    // Draw dots
    const highlightedIndices = new Set(animationState.currentSampleIndices);

    g.selectAll('.dot')
      .data(dotPositions)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => {
        if (
          highlightedIndices.has(d.index) &&
          animationState.phase === 'converge' &&
          animationState.targetMean !== null
        ) {
          const targetY = topInnerHeight - 10;
          return d.y + (targetY - d.y) * animationState.progress;
        }
        return d.y;
      })
      .attr('cx', (d) => {
        if (
          highlightedIndices.has(d.index) &&
          animationState.phase === 'converge' &&
          animationState.targetMean !== null
        ) {
          const targetX = xScale(animationState.targetMean);
          return d.x + (targetX - d.x) * animationState.progress;
        }
        return d.x;
      })
      .attr('r', (d) => (highlightedIndices.has(d.index) && animationState.phase === 'highlight' ? 4 : 2))
      .attr('fill', (d) => (highlightedIndices.has(d.index) ? '#e63946' : '#4361ee'))
      .attr('opacity', (d) => {
        if (animationState.phase === 'drop' && highlightedIndices.has(d.index)) {
          return 1 - animationState.progress;
        }
        if (highlightedIndices.size > 0 && !highlightedIndices.has(d.index)) {
          return 0.3;
        }
        return 0.7;
      });

    // Draw population mean line
    g.append('line')
      .attr('x1', xScale(POPULATION_MEAN))
      .attr('x2', xScale(POPULATION_MEAN))
      .attr('y1', 0)
      .attr('y2', topInnerHeight)
      .attr('stroke', '#2d3436')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
  }, [dotPositions, xScale, topInnerHeight, animationState]);

  // Draw bottom histogram of sample means
  useEffect(() => {
    if (!bottomSvgRef.current) return;

    const svg = d3.select(bottomSvgRef.current);
    const g = svg.select<SVGGElement>('.sampling-content');
    g.selectAll('*').remove();

    // Rectangle size for histogram
    const rectHeight = 1.5;
    const rectWidth = 8;
    const rectGap = 0.5;
    const numBins = 120;
    const binWidth = (xDomain.max - xDomain.min) / numBins;

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${bottomInnerHeight})`)
      .call(xAxis);

    // Group sample means into bins and track positions
    const binCounts: number[] = Array(numBins).fill(0);

    sampleMeans.forEach((sampleMean) => {
      const binIndex = Math.floor((sampleMean - xDomain.min) / binWidth);
      if (binIndex >= 0 && binIndex < numBins) {
        const count = binCounts[binIndex];
        const binCenterX = xScale(xDomain.min + (binIndex + 0.5) * binWidth);
        const y = bottomInnerHeight - (count + 1) * (rectHeight + rectGap);

        g.append('rect')
          .attr('class', 'sample-mean-rect')
          .attr('x', binCenterX - rectWidth / 2)
          .attr('y', y)
          .attr('width', rectWidth)
          .attr('height', rectHeight)
          .attr('fill', '#e63946')
          .attr('opacity', 0.8);

        binCounts[binIndex]++;
      }
    });

    // Animated dropping rectangle
    if (animationState.phase === 'drop' && animationState.targetMean !== null) {
      const binIndex = Math.floor((animationState.targetMean - xDomain.min) / binWidth);
      const binCenterX = xScale(xDomain.min + (binIndex + 0.5) * binWidth);
      const targetCount = binCounts[binIndex] || 0;

      const startY = -rectHeight;
      const endY = bottomInnerHeight - (targetCount + 1) * (rectHeight + rectGap);
      const currentY = startY + (endY - startY) * animationState.progress;

      g.append('rect')
        .attr('class', 'animated-rect')
        .attr('x', binCenterX - rectWidth / 2)
        .attr('y', currentY)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('fill', '#e63946')
        .attr('opacity', 1)
        .attr('stroke', '#c1121f')
        .attr('stroke-width', 1);
    }

    // Draw theoretical sampling distribution curve (t-distribution) when animation is complete
    if (sampleMeans.length >= numberOfSamples) {
      const standardError = POPULATION_STD / Math.sqrt(sampleSize);
      const df = sampleSize - 1;

      const gammaLn = (z: number): number => {
        const g = 7;
        const c = [
          0.99999999999980993, 676.5203681218851, -1259.1392167224028,
          771.32342877765313, -176.61502916214059, 12.507343278686905,
          -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        if (z < 0.5) {
          return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
        }
        z -= 1;
        let x = c[0];
        for (let i = 1; i < g + 2; i++) {
          x += c[i] / (z + i);
        }
        const t = z + g + 0.5;
        return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
      };

      const tPdf = (t: number, nu: number): number => {
        const coef = Math.exp(gammaLn((nu + 1) / 2) - gammaLn(nu / 2)) / Math.sqrt(nu * Math.PI);
        return coef * Math.pow(1 + (t * t) / nu, -(nu + 1) / 2);
      };

      // Calculate the peak of the t-distribution PDF (at t=0) in x-scale
      const peakPdfValue = tPdf(0, df) / standardError;

      // Calculate expected max bin count if histogram perfectly matched theoretical distribution
      // Expected count in peak bin = numberOfSamples * peakPdf * binWidth
      const expectedMaxBinCount = numberOfSamples * peakPdfValue * binWidth;

      // Scale factor: curve peak should match expected max bin count
      const scaleFactor = expectedMaxBinCount / peakPdfValue;

      const curvePoints: [number, number][] = [];
      const numPoints = 200;

      for (let i = 0; i <= numPoints; i++) {
        const x = xDomain.min + (i / numPoints) * (xDomain.max - xDomain.min);
        const t = (x - POPULATION_MEAN) / standardError;
        const pdf = tPdf(t, df) / standardError;
        const scaledCount = pdf * scaleFactor;
        const y = bottomInnerHeight - scaledCount * (rectHeight + rectGap);
        curvePoints.push([xScale(x), y]);
      }

      const line = d3.line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveBasis);

      g.append('path')
        .attr('d', line(curvePoints))
        .attr('fill', 'none')
        .attr('stroke', '#2d3436')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,4');

      // Display theoretical distribution parameters
      g.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .attr('font-size', '12px')
        .attr('fill', '#2d3436')
        .text(`Theoretical t-distribution (df = ${df}):`);

      g.append('text')
        .attr('x', 10)
        .attr('y', 36)
        .attr('font-size', '12px')
        .attr('fill', '#2d3436')
        .text(`Mean = ${POPULATION_MEAN}, SE = ${standardError.toFixed(2)}`);
    }

    // Draw population mean line
    g.append('line')
      .attr('x1', xScale(POPULATION_MEAN))
      .attr('x2', xScale(POPULATION_MEAN))
      .attr('y1', 0)
      .attr('y2', bottomInnerHeight)
      .attr('stroke', '#2d3436')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Label
    g.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('fill', '#495057')
      .text(`Sample Means: ${sampleMeans.length}/${numberOfSamples}`);
  }, [sampleMeans, xScale, xDomain, bottomInnerHeight, innerWidth, numberOfSamples, animationState, sampleSize]);

  // Start/Reset handlers
  const handleStart = () => {
    if (sampleMeans.length >= numberOfSamples) {
      setSampleMeans([]);
      setAnimationState({ phase: 'idle', progress: 0, currentSampleIndices: [], targetMean: null });
    }
    setIsRunning(true);
    setTimeout(runSample, 100);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSampleMeans([]);
    setAnimationState({ phase: 'idle', progress: 0, currentSampleIndices: [], targetMean: null });
  };

  return (
    <section className="narrative-section skewed-sampling-section">
      <div className="section-intro">
        <h2>Sampling from Non-Normal Distributions</h2>

        <p className="intro-text">
          First, what do you think would happen if we repeatedly sampled means from a non-normal
          distribution, like a <strong>skewed distribution</strong>?
        </p>

        <p className="intro-text">
          The population below is right-skewed (similar to a log-normal distribution), but it has
          the <strong>same mean (μ = {POPULATION_MEAN}) and standard deviation (σ = {POPULATION_STD})</strong> as
          the normal distribution above. Let's see what happens when we take {numberOfSamples} samples
          of size {sampleSize} from this population.
        </p>
      </div>

      <div className="sampling-distribution-viz">
        <div className="viz-container">
          {/* Skewed population histogram (top) */}
          <svg
            ref={topSvgRef}
            width={width}
            height={topHeight}
            className="population-display"
          >
            <text x={width / 2} y={15} textAnchor="middle" fontSize="14" fontWeight="bold">
              Skewed Population Distribution
            </text>
            <g className="population-content" transform={`translate(${margin.left}, ${margin.top})`} />
          </svg>

          {/* Sample means histogram (bottom) */}
          <svg
            ref={bottomSvgRef}
            width={width}
            height={bottomHeight}
            className="sampling-display"
          >
            <text x={width / 2} y={15} textAnchor="middle" fontSize="14" fontWeight="bold">
              Sample Means
            </text>
            <g className="sampling-content" transform={`translate(${margin.left}, ${margin.top})`} />
          </svg>
        </div>

        <div className="controls-row">
          <button
            className="primary-button"
            onClick={handleStart}
            disabled={isRunning}
          >
            {sampleMeans.length >= numberOfSamples ? 'Reset & Start Again' : isRunning ? 'Running...' : 'Start Sampling'}
          </button>
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={sampleMeans.length === 0 && !isRunning}
          >
            Reset
          </button>
        </div>

        <div className="progress-display">
          <progress value={sampleMeans.length} max={numberOfSamples} />
          <p>{sampleMeans.length} of {numberOfSamples} samples collected</p>
        </div>
      </div>

      {sampleMeans.length >= numberOfSamples && (
        <div className="section-conclusion">
          <p className="completion-text">
            It might be surprising, but the sampling distribution of means sampled from a non-normal
            distribution still forms a bell-shaped distribution. This is the <strong>Central Limit
            Theorem</strong> in action: regardless of the population's shape, the distribution of sample
            means approaches a normal distribution as the sample size increases.
          </p>
          <p className="completion-text" style={{ marginTop: '1rem' }}>
            So if the sampling distribution of the means does not depend on the shape of the population
            the means are calculated from, what <em>does</em> it depend on?
          </p>
        </div>
      )}
    </section>
  );
}
