import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { generatePopulation, drawSampleIndices, mean } from '../../../utils/statistics';

interface SampleSizeComparisonSectionProps {
  numberOfSamples?: number;
}

// Population parameters (same as other sections)
const POPULATION_SIZE = 500;
const POPULATION_MEAN = 50;
const POPULATION_STD = 10;

// Sample sizes to compare
const SMALL_SAMPLE_SIZE = 10;
const LARGE_SAMPLE_SIZE = 30;

export default function SampleSizeComparisonSection({
  numberOfSamples = 500,
}: SampleSizeComparisonSectionProps) {
  // Refs for both visualizations
  const smallSvgRef = useRef<SVGSVGElement>(null);
  const largeSvgRef = useRef<SVGSVGElement>(null);

  // State for both simulations
  const [smallSampleMeans, setSmallSampleMeans] = useState<number[]>([]);
  const [largeSampleMeans, setLargeSampleMeans] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [samplesCompleted, setSamplesCompleted] = useState(0);

  // Generate same population for both
  const populationData = useMemo(() => {
    return generatePopulation('normal', POPULATION_MEAN, POPULATION_STD, POPULATION_SIZE);
  }, []);

  // X-axis domain
  const xDomain = useMemo(() => {
    const buffer = POPULATION_STD * 4;
    return { min: POPULATION_MEAN - buffer, max: POPULATION_MEAN + buffer };
  }, []);

  // Dimensions for each chart (height increased by 75% to fit both distributions)
  const width = 340;
  const height = 315;
  const margin = { top: 30, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scale
  const xScale = useMemo(
    () => d3.scaleLinear().domain([xDomain.min, xDomain.max]).range([0, innerWidth]),
    [xDomain, innerWidth]
  );

  // Run samples for both simultaneously
  const runSamples = useCallback(() => {
    if (samplesCompleted >= numberOfSamples) {
      setIsRunning(false);
      return;
    }

    // Draw sample for small sample size
    const smallIndices = drawSampleIndices(populationData.length, SMALL_SAMPLE_SIZE);
    const smallValues = smallIndices.map((i) => populationData[i]);
    const smallMean = mean(smallValues);

    // Draw sample for large sample size
    const largeIndices = drawSampleIndices(populationData.length, LARGE_SAMPLE_SIZE);
    const largeValues = largeIndices.map((i) => populationData[i]);
    const largeMean = mean(largeValues);

    setSmallSampleMeans((prev) => [...prev, smallMean]);
    setLargeSampleMeans((prev) => [...prev, largeMean]);
    setSamplesCompleted((prev) => prev + 1);
  }, [populationData, samplesCompleted, numberOfSamples]);

  // Animation loop (constant speed)
  useEffect(() => {
    if (!isRunning) return;

    const timeout = setTimeout(runSamples, 5);
    return () => clearTimeout(timeout);
  }, [isRunning, samplesCompleted, runSamples]);

  // Helper function to draw histogram
  const drawHistogram = (
    svgRef: React.RefObject<SVGSVGElement>,
    sampleMeans: number[],
    sampleSize: number,
    title: string
  ) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.chart-content');
    g.selectAll('*').remove();

    const rectHeight = 1.5;
    const rectWidth = 6;
    const rectGap = 0.5;
    const numBins = 80;
    const binWidth = (xDomain.max - xDomain.min) / numBins;

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(5);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    // Group sample means into bins
    const binCounts: number[] = Array(numBins).fill(0);

    sampleMeans.forEach((sampleMean) => {
      const binIndex = Math.floor((sampleMean - xDomain.min) / binWidth);
      if (binIndex >= 0 && binIndex < numBins) {
        const count = binCounts[binIndex];
        const binCenterX = xScale(xDomain.min + (binIndex + 0.5) * binWidth);
        const y = innerHeight - (count + 1) * (rectHeight + rectGap);

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

      const peakPdfValue = tPdf(0, df) / standardError;
      const expectedMaxBinCount = numberOfSamples * peakPdfValue * binWidth;
      const scaleFactor = expectedMaxBinCount / peakPdfValue;

      const curvePoints: [number, number][] = [];
      const numPoints = 100;

      for (let i = 0; i <= numPoints; i++) {
        const x = xDomain.min + (i / numPoints) * (xDomain.max - xDomain.min);
        const t = (x - POPULATION_MEAN) / standardError;
        const pdf = tPdf(t, df) / standardError;
        const scaledCount = pdf * scaleFactor;
        const y = innerHeight - scaledCount * (rectHeight + rectGap);
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
      .attr('x1', xScale(POPULATION_MEAN))
      .attr('x2', xScale(POPULATION_MEAN))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#2d3436')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    // Title
    svg.select('.chart-title')
      .attr('x', width / 2)
      .attr('y', 18)
      .text(title);
  };

  // Draw both histograms
  useEffect(() => {
    drawHistogram(smallSvgRef, smallSampleMeans, SMALL_SAMPLE_SIZE, `n = ${SMALL_SAMPLE_SIZE}`);
  }, [smallSampleMeans, xScale, numberOfSamples]);

  useEffect(() => {
    drawHistogram(largeSvgRef, largeSampleMeans, LARGE_SAMPLE_SIZE, `n = ${LARGE_SAMPLE_SIZE}`);
  }, [largeSampleMeans, xScale, numberOfSamples]);

  // Handlers
  const handleStart = () => {
    if (samplesCompleted >= numberOfSamples) {
      setSmallSampleMeans([]);
      setLargeSampleMeans([]);
      setSamplesCompleted(0);
    }
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSmallSampleMeans([]);
    setLargeSampleMeans([]);
    setSamplesCompleted(0);
  };

  return (
    <section className="narrative-section sample-size-comparison-section">
      <div className="section-intro">
        <h2>More Observations = Narrower Sampling Distribution</h2>

        <p className="intro-text">
          The width of the sampling distribution depends on how many observations the sample contains
          (i.e., the <strong>sample size n</strong>). As n increases, the sampling distribution becomes
          narrower around the population mean. Let's see this in action by comparing samples of
          size <strong>n = {SMALL_SAMPLE_SIZE}</strong> versus <strong>n = {LARGE_SAMPLE_SIZE}</strong>.
        </p>
      </div>

      <div className="sampling-distribution-viz">
        <div className="comparison-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {/* Small sample size */}
          <div className="comparison-chart">
            <svg ref={smallSvgRef} width={width} height={height}>
              <text className="chart-title" textAnchor="middle" fontSize="14" fontWeight="bold" />
              <g className="chart-content" transform={`translate(${margin.left}, ${margin.top})`} />
            </svg>
          </div>

          {/* Large sample size */}
          <div className="comparison-chart">
            <svg ref={largeSvgRef} width={width} height={height}>
              <text className="chart-title" textAnchor="middle" fontSize="14" fontWeight="bold" />
              <g className="chart-content" transform={`translate(${margin.left}, ${margin.top})`} />
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
            Notice how the sampling distribution with <strong>n = {LARGE_SAMPLE_SIZE}</strong> (SE = {(POPULATION_STD / Math.sqrt(LARGE_SAMPLE_SIZE)).toFixed(2)}) is
            much narrower than the one with <strong>n = {SMALL_SAMPLE_SIZE}</strong> (SE = {(POPULATION_STD / Math.sqrt(SMALL_SAMPLE_SIZE)).toFixed(2)}).
            This is why larger samples give us more precise estimates of the population mean — there's
            less variability in where the sample mean might fall.
          </p>
        </div>
      )}
    </section>
  );
}
