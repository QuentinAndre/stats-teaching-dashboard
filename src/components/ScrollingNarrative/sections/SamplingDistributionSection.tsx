import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { generatePopulation, drawSampleIndices, mean } from '../../../utils/statistics';

interface SamplingDistributionSectionProps {
  sampleSize?: number;
  numberOfSamples?: number;
}

// Population parameters
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

export default function SamplingDistributionSection({
  sampleSize = 25,
  numberOfSamples = 200,
}: SamplingDistributionSectionProps) {
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

  // Generate population data once
  const populationData = useMemo(() => {
    return generatePopulation('normal', POPULATION_MEAN, POPULATION_STD, POPULATION_SIZE);
  }, []);

  // X-axis domain (shared between top and bottom)
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
    const binWidth = (xDomain.max - xDomain.min) / 40;
    const dotRadius = 3;
    const dotsPerRow = Math.floor((innerWidth / 40 - 2) / (dotRadius * 2));

    const binIndices: number[][] = Array.from({ length: 40 }, () => []);
    populationData.forEach((value, index) => {
      if (value >= xDomain.min && value < xDomain.max) {
        const binIndex = Math.floor((value - xDomain.min) / binWidth);
        if (binIndex >= 0 && binIndex < 40) {
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

  // Draw top histogram (population)
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
      .attr('r', (d) => (highlightedIndices.has(d.index) && animationState.phase === 'highlight' ? 5 : 3))
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

  // Draw bottom rugplot
  useEffect(() => {
    if (!bottomSvgRef.current) return;

    const svg = d3.select(bottomSvgRef.current);
    const g = svg.select<SVGGElement>('.rugplot-content');
    g.selectAll('*').remove();

    const stickHeight = bottomInnerHeight * 0.6;
    const stickWidth = 2;

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${bottomInnerHeight})`)
      .call(xAxis);

    // Draw rugplot sticks
    sampleMeans.forEach((sampleMean) => {
      const xPos = xScale(sampleMean);
      g.append('rect')
        .attr('class', 'rugplot-stick')
        .attr('x', xPos - stickWidth / 2)
        .attr('y', bottomInnerHeight - stickHeight)
        .attr('width', stickWidth)
        .attr('height', stickHeight)
        .attr('fill', '#4361ee')
        .attr('opacity', 0.6);
    });

    // Animated dropping stick
    if (animationState.phase === 'drop' && animationState.targetMean !== null) {
      const targetX = xScale(animationState.targetMean);
      const startY = -stickHeight;
      const endY = bottomInnerHeight - stickHeight;
      const currentY = startY + (endY - startY) * animationState.progress;

      g.append('rect')
        .attr('class', 'animated-stick')
        .attr('x', targetX - stickWidth / 2)
        .attr('y', currentY)
        .attr('width', stickWidth)
        .attr('height', stickHeight)
        .attr('fill', '#e63946')
        .attr('opacity', 1);
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
  }, [sampleMeans, xScale, bottomInnerHeight, innerWidth, numberOfSamples, animationState]);

  // Start/Reset handlers
  const handleStart = () => {
    if (sampleMeans.length >= numberOfSamples) {
      // Reset
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
    <section className="narrative-section sampling-distribution-section">
      <div className="section-intro">
        <h2>The Sampling Distribution</h2>

        <p className="intro-text">
          What happens if we repeat this sampling process many times? Each time we draw a new
          sample, we get a different sample mean. The distribution of all these sample means is
          called the <strong>sampling distribution</strong>.
        </p>

        <p className="intro-text">
          Click the button below to watch as we take {numberOfSamples} samples of size {sampleSize}.
          Each sample's mean will drop down as a vertical stick on the bottom plot.
        </p>
      </div>

      <div className="sampling-distribution-viz">
        <div className="viz-container">
          {/* Population histogram (top) */}
          <svg
            ref={topSvgRef}
            width={width}
            height={topHeight}
            className="population-display"
          >
            <text x={width / 2} y={15} textAnchor="middle" fontSize="14" fontWeight="bold">
              Population Distribution
            </text>
            <g className="population-content" transform={`translate(${margin.left}, ${margin.top})`} />
          </svg>

          {/* Rugplot (bottom) */}
          <svg
            ref={bottomSvgRef}
            width={width}
            height={bottomHeight}
            className="sampling-display"
          >
            <text x={width / 2} y={15} textAnchor="middle" fontSize="14" fontWeight="bold">
              Sample Means
            </text>
            <g className="rugplot-content" transform={`translate(${margin.left}, ${margin.top})`} />
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
            Notice how the sample means cluster around the population mean (μ = {POPULATION_MEAN}).
            This is the <strong>sampling distribution</strong> — it shows us the variability we can
            expect when estimating the population mean from samples. The more samples we take, the
            clearer this pattern becomes.
          </p>
        </div>
      )}
    </section>
  );
}
