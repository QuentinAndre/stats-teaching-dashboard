import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { generatePopulation, drawSampleIndices, mean } from '../../../utils/statistics';

interface HeterogeneityComparisonSectionProps {
  sampleSize?: number;
  numberOfSamples?: number;
}

// Population parameters
const POPULATION_SIZE = 500;
const POPULATION_MEAN = 50;

// Standard deviations to compare (heterogeneity levels)
const LOW_STD = 10;   // Homogeneous population
const HIGH_STD = 20; // Heterogeneous population

export default function HeterogeneityComparisonSection({
  sampleSize = 15,
  numberOfSamples = 500,
}: HeterogeneityComparisonSectionProps) {
  // Refs for population displays
  const homogPopRef = useRef<SVGSVGElement>(null);
  const heterogPopRef = useRef<SVGSVGElement>(null);
  // Refs for sampling distribution displays
  const homogSamplingRef = useRef<SVGSVGElement>(null);
  const heterogSamplingRef = useRef<SVGSVGElement>(null);

  // State for both simulations
  const [homogSampleMeans, setHomogSampleMeans] = useState<number[]>([]);
  const [heterogSampleMeans, setHeterogSampleMeans] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [samplesCompleted, setSamplesCompleted] = useState(0);

  // Generate populations with different heterogeneity
  const homogPopulation = useMemo(() => {
    return generatePopulation('normal', POPULATION_MEAN, LOW_STD, POPULATION_SIZE);
  }, []);

  const heterogPopulation = useMemo(() => {
    return generatePopulation('normal', POPULATION_MEAN, HIGH_STD, POPULATION_SIZE);
  }, []);

  // X-axis domain for population (wide enough for heterogeneous population)
  const popXDomain = useMemo(() => {
    const buffer = HIGH_STD * 4;
    return { min: POPULATION_MEAN - buffer, max: POPULATION_MEAN + buffer };
  }, []);

  // X-axis domain for sampling distributions (tighter range)
  const samplingXDomain = useMemo(() => {
    return { min: 20, max: 80 };
  }, []);

  // Dimensions
  const width = 340;
  const popHeight = 240;
  const samplingHeight = 240;
  const margin = { top: 25, right: 20, bottom: 25, left: 40 };
  const popInnerWidth = width - margin.left - margin.right;
  const popInnerHeight = popHeight - margin.top - margin.bottom;
  const samplingInnerHeight = samplingHeight - margin.top - margin.bottom;

  // Scale for population
  const popXScale = useMemo(
    () => d3.scaleLinear().domain([popXDomain.min, popXDomain.max]).range([0, popInnerWidth]),
    [popXDomain, popInnerWidth]
  );

  // Scale for sampling distributions
  const samplingXScale = useMemo(
    () => d3.scaleLinear().domain([samplingXDomain.min, samplingXDomain.max]).range([0, popInnerWidth]),
    [samplingXDomain, popInnerWidth]
  );

  // Run samples for both simultaneously
  const runSamples = useCallback(() => {
    if (samplesCompleted >= numberOfSamples) {
      setIsRunning(false);
      return;
    }

    // Draw sample from homogeneous population
    const homogIndices = drawSampleIndices(homogPopulation.length, sampleSize);
    const homogValues = homogIndices.map((i) => homogPopulation[i]);
    const homogMean = mean(homogValues);

    // Draw sample from heterogeneous population
    const heterogIndices = drawSampleIndices(heterogPopulation.length, sampleSize);
    const heterogValues = heterogIndices.map((i) => heterogPopulation[i]);
    const heterogMean = mean(heterogValues);

    setHomogSampleMeans((prev) => [...prev, homogMean]);
    setHeterogSampleMeans((prev) => [...prev, heterogMean]);
    setSamplesCompleted((prev) => prev + 1);
  }, [homogPopulation, heterogPopulation, sampleSize, samplesCompleted, numberOfSamples]);

  // Animation loop (constant speed)
  useEffect(() => {
    if (!isRunning) return;

    const timeout = setTimeout(runSamples, 5);
    return () => clearTimeout(timeout);
  }, [isRunning, samplesCompleted, runSamples]);

  // Draw population histogram
  const drawPopulation = (
    svgRef: React.RefObject<SVGSVGElement>,
    populationData: number[],
    std: number,
    title: string
  ) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.pop-content');
    g.selectAll('*').remove();

    const numBins = 50;
    const binWidth = (popXDomain.max - popXDomain.min) / numBins;
    const dotRadius = 1.5;
    const dotsPerRow = Math.floor((popInnerWidth / numBins - 1) / (dotRadius * 2));

    // Group data into bins
    const binIndices: number[][] = Array.from({ length: numBins }, () => []);
    populationData.forEach((value, index) => {
      if (value >= popXDomain.min && value < popXDomain.max) {
        const binIndex = Math.floor((value - popXDomain.min) / binWidth);
        if (binIndex >= 0 && binIndex < numBins) {
          binIndices[binIndex].push(index);
        }
      }
    });

    // Draw dots
    binIndices.forEach((indices, binIdx) => {
      const binX = popXScale(popXDomain.min + (binIdx + 0.5) * binWidth);
      indices.forEach((_, posInBin) => {
        const row = Math.floor(posInBin / dotsPerRow);
        const col = posInBin % dotsPerRow;
        const x = binX + (col - dotsPerRow / 2) * dotRadius * 2;
        const y = popInnerHeight - (row + 1) * dotRadius * 2;

        g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', dotRadius)
          .attr('fill', '#4361ee')
          .attr('opacity', 0.7);
      });
    });

    // Draw x-axis
    const xAxis = d3.axisBottom(popXScale).ticks(5);
    g.append('g')
      .attr('transform', `translate(0, ${popInnerHeight})`)
      .call(xAxis);

    // Title with σ value
    svg.select('.pop-title')
      .attr('x', width / 2)
      .attr('y', 15)
      .text(`${title} (σ = ${std})`);
  };

  // Draw sampling distribution histogram
  const drawSamplingDistribution = (
    svgRef: React.RefObject<SVGSVGElement>,
    sampleMeans: number[],
    std: number,
    title: string
  ) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.sampling-content');
    g.selectAll('*').remove();

    const rectHeight = 1.5;
    const rectWidth = 6;
    const rectGap = 0.5;
    const numBins = 80;
    const binWidth = (samplingXDomain.max - samplingXDomain.min) / numBins;

    // Draw x-axis
    const xAxis = d3.axisBottom(samplingXScale).ticks(5);
    g.append('g')
      .attr('transform', `translate(0, ${samplingInnerHeight})`)
      .call(xAxis);

    // Group sample means into bins
    const binCounts: number[] = Array(numBins).fill(0);

    sampleMeans.forEach((sampleMean) => {
      const binIndex = Math.floor((sampleMean - samplingXDomain.min) / binWidth);
      if (binIndex >= 0 && binIndex < numBins) {
        const count = binCounts[binIndex];
        const binCenterX = samplingXScale(samplingXDomain.min + (binIndex + 0.5) * binWidth);
        const y = samplingInnerHeight - (count + 1) * (rectHeight + rectGap);

        g.append('rect')
          .attr('x', binCenterX - rectWidth / 2)
          .attr('y', y)
          .attr('width', rectWidth)
          .attr('height', rectHeight)
          .attr('fill', '#e63946')
          .attr('opacity', 0.8);

        binCounts[binIndex]++;
      }
    });

    // Draw theoretical t-distribution curve when complete
    if (sampleMeans.length >= numberOfSamples) {
      const standardError = std / Math.sqrt(sampleSize);
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

      const peakPdfValue = tPdf(0, df) / standardError;
      const expectedMaxBinCount = numberOfSamples * peakPdfValue * binWidth;
      const scaleFactor = expectedMaxBinCount / peakPdfValue;

      const curvePoints: [number, number][] = [];
      const numPoints = 100;

      for (let i = 0; i <= numPoints; i++) {
        const x = samplingXDomain.min + (i / numPoints) * (samplingXDomain.max - samplingXDomain.min);
        const t = (x - POPULATION_MEAN) / standardError;
        const pdf = tPdf(t, df) / standardError;
        const scaledCount = pdf * scaleFactor;
        const y = samplingInnerHeight - scaledCount * (rectHeight + rectGap);
        curvePoints.push([samplingXScale(x), y]);
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
        .attr('stroke-dasharray', '6,3');

      // Display SE
      g.append('text')
        .attr('x', 5)
        .attr('y', 15)
        .attr('font-size', '11px')
        .attr('fill', '#2d3436')
        .text(`SE = ${standardError.toFixed(2)}`);
    }

    // Draw population mean line
    g.append('line')
      .attr('x1', samplingXScale(POPULATION_MEAN))
      .attr('x2', samplingXScale(POPULATION_MEAN))
      .attr('y1', 0)
      .attr('y2', samplingInnerHeight)
      .attr('stroke', '#2d3436')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    // Title
    svg.select('.sampling-title')
      .attr('x', width / 2)
      .attr('y', 15)
      .text(title);
  };

  // Draw all visualizations
  useEffect(() => {
    drawPopulation(homogPopRef, homogPopulation, LOW_STD, 'Lower Variance');
    drawPopulation(heterogPopRef, heterogPopulation, HIGH_STD, 'Higher Variance');
  }, [homogPopulation, heterogPopulation, popXScale]);

  useEffect(() => {
    drawSamplingDistribution(homogSamplingRef, homogSampleMeans, LOW_STD, 'Sample Means');
  }, [homogSampleMeans, samplingXScale, numberOfSamples, sampleSize]);

  useEffect(() => {
    drawSamplingDistribution(heterogSamplingRef, heterogSampleMeans, HIGH_STD, 'Sample Means');
  }, [heterogSampleMeans, samplingXScale, numberOfSamples, sampleSize]);

  // Handlers
  const handleStart = () => {
    if (samplesCompleted >= numberOfSamples) {
      setHomogSampleMeans([]);
      setHeterogSampleMeans([]);
      setSamplesCompleted(0);
    }
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHomogSampleMeans([]);
    setHeterogSampleMeans([]);
    setSamplesCompleted(0);
  };

  return (
    <section className="narrative-section heterogeneity-comparison-section">
      <div className="section-intro">
        <h2>Heterogeneous Population = Wider Sampling Distribution</h2>

        <p className="intro-text">
          The width of the sampling distribution also depends on the <strong>variability of the population</strong>.
          When a population is more heterogeneous (higher σ), individual observations vary more,
          which leads to more variability in sample means.
        </p>

        <p className="intro-text">
          Below, we compare sampling from a <strong>less variable population</strong> (σ = {LOW_STD}) versus
          a <strong>more variable population</strong> (σ = {HIGH_STD}). Both populations have the same
          mean (μ = {POPULATION_MEAN}), and we'll take samples of size n = {sampleSize} from each.
        </p>
      </div>

      <div className="sampling-distribution-viz">
        <div className="comparison-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {/* Homogeneous side */}
          <div className="comparison-column">
            <svg ref={homogPopRef} width={width} height={popHeight}>
              <text className="pop-title" textAnchor="middle" fontSize="13" fontWeight="bold" />
              <g className="pop-content" transform={`translate(${margin.left}, ${margin.top})`} />
            </svg>
            <svg ref={homogSamplingRef} width={width} height={samplingHeight}>
              <text className="sampling-title" textAnchor="middle" fontSize="13" fontWeight="bold" />
              <g className="sampling-content" transform={`translate(${margin.left}, ${margin.top})`} />
            </svg>
          </div>

          {/* Heterogeneous side */}
          <div className="comparison-column">
            <svg ref={heterogPopRef} width={width} height={popHeight}>
              <text className="pop-title" textAnchor="middle" fontSize="13" fontWeight="bold" />
              <g className="pop-content" transform={`translate(${margin.left}, ${margin.top})`} />
            </svg>
            <svg ref={heterogSamplingRef} width={width} height={samplingHeight}>
              <text className="sampling-title" textAnchor="middle" fontSize="13" fontWeight="bold" />
              <g className="sampling-content" transform={`translate(${margin.left}, ${margin.top})`} />
            </svg>
          </div>
        </div>

        <div className="controls-row">
          <button
            className="primary-button"
            onClick={handleStart}
            disabled={isRunning}
          >
            {samplesCompleted >= numberOfSamples ? 'Reset & Start Again' : isRunning ? 'Running...' : 'Start Sampling'}
          </button>
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={samplesCompleted === 0 && !isRunning}
          >
            Reset
          </button>
        </div>

        <div className="progress-display">
          <progress value={samplesCompleted} max={numberOfSamples} />
          <p>{samplesCompleted} of {numberOfSamples} samples collected (each)</p>
        </div>
      </div>

      {samplesCompleted >= numberOfSamples && (
        <div className="section-conclusion">
          <p className="completion-text">
            Notice how the sampling distribution from the <strong>more variable population</strong> (SE = {(HIGH_STD / Math.sqrt(sampleSize)).toFixed(2)}) is
            wider than from the <strong>less variable population</strong> (SE = {(LOW_STD / Math.sqrt(sampleSize)).toFixed(2)}).
            This makes intuitive sense: when individual observations vary more, the averages we compute from
            samples will also vary more.
          </p>
        </div>
      )}
    </section>
  );
}
