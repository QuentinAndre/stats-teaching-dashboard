import { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as d3 from 'd3';
import type { RootState } from '../../../store';
import { createHistogramBins } from '../../../utils/statistics';
import type { AnimationPhase, AnimatedDot, SimulationDimensions } from './types';
import { DEFAULT_DIMENSIONS } from './types';

interface PopulationDisplayProps {
  animationPhase: AnimationPhase;
  animatedDots: AnimatedDot[];
  targetMean: number | null;
  dimensions?: SimulationDimensions;
  xDomain: { min: number; max: number };
}

export default function PopulationDisplay({
  animationPhase,
  animatedDots: _animatedDots,
  targetMean,
  dimensions = DEFAULT_DIMENSIONS,
  xDomain,
}: PopulationDisplayProps) {
  // _animatedDots reserved for future enhanced animation
  const svgRef = useRef<SVGSVGElement>(null);
  const { populationData, currentSampleIndices, populationMean } =
    useSelector((state: RootState) => state.sampling);

  const { width, height, margin } = dimensions;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Use shared xDomain for x-axis alignment with SamplingDisplay
  const dataRange = xDomain;

  // Create histogram bins
  const bins = useMemo(() => {
    if (populationData.length === 0) return [];
    return createHistogramBins(populationData, 40, dataRange.min, dataRange.max);
  }, [populationData, dataRange]);

  // Scales
  const xScale = useMemo(
    () => d3.scaleLinear().domain([dataRange.min, dataRange.max]).range([0, innerWidth]),
    [dataRange, innerWidth]
  );

  const yScale = useMemo(() => {
    const maxCount = d3.max(bins, (d) => d.count) ?? 0;
    return d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);
  }, [bins, innerHeight]);

  // Assign dots to positions within bins
  const dotPositions = useMemo(() => {
    if (populationData.length === 0) return [];

    const binWidth = (dataRange.max - dataRange.min) / 40;
    const dotRadius = 3;
    const dotsPerRow = Math.floor((innerWidth / 40 - 2) / (dotRadius * 2));

    // Group data indices by bin
    const binIndices: number[][] = Array.from({ length: 40 }, () => []);
    populationData.forEach((value, index) => {
      if (value >= dataRange.min && value < dataRange.max) {
        const binIndex = Math.floor((value - dataRange.min) / binWidth);
        if (binIndex >= 0 && binIndex < 40) {
          binIndices[binIndex].push(index);
        }
      }
    });

    // Calculate positions for each dot
    const positions: { index: number; x: number; y: number; value: number }[] = [];

    binIndices.forEach((indices, binIdx) => {
      const binX = xScale(dataRange.min + (binIdx + 0.5) * binWidth);

      indices.forEach((dataIndex, posInBin) => {
        const row = Math.floor(posInBin / dotsPerRow);
        const col = posInBin % dotsPerRow;
        const x = binX + (col - dotsPerRow / 2) * dotRadius * 2;
        const y = innerHeight - (row + 1) * dotRadius * 2;

        positions.push({
          index: dataIndex,
          x,
          y,
          value: populationData[dataIndex],
        });
      });
    });

    return positions;
  }, [populationData, dataRange, innerWidth, innerHeight, xScale]);

  // Draw the visualization
  useEffect(() => {
    if (!svgRef.current || dotPositions.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.population-content');

    // Clear previous content
    g.selectAll('*').remove();

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    // Draw dots
    const dots = g
      .selectAll<SVGCircleElement, (typeof dotPositions)[0]>('.dot')
      .data(dotPositions, (d) => d.index.toString());

    dots
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 3)
      .attr('fill', (d) =>
        currentSampleIndices.includes(d.index) ? '#e63946' : '#4361ee'
      )
      .attr('opacity', 0.7);

    // Draw population mean line
    g.append('line')
      .attr('class', 'mean-line')
      .attr('x1', xScale(populationMean))
      .attr('x2', xScale(populationMean))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#2d3436')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Title
    svg
      .select('.title')
      .attr('x', width / 2)
      .attr('y', 15)
      .text('Population Distribution');
  }, [
    dotPositions,
    currentSampleIndices,
    xScale,
    yScale,
    innerHeight,
    width,
    populationMean,
  ]);

  // Animate highlighted dots during sampling
  useEffect(() => {
    if (!svgRef.current || animationPhase.phase === 'complete') return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.population-content');

    const highlightedIndices = new Set(currentSampleIndices);

    if (animationPhase.phase === 'highlight') {
      // Pulse effect on highlighted dots
      g.selectAll<SVGCircleElement, (typeof dotPositions)[0]>('.dot')
        .attr('fill', (d) =>
          highlightedIndices.has(d.index) ? '#e63946' : '#4361ee'
        )
        .attr('r', (d) => (highlightedIndices.has(d.index) ? 5 : 3))
        .attr('opacity', (d) => (highlightedIndices.has(d.index) ? 1 : 0.3));
    } else if (animationPhase.phase === 'converge' && targetMean !== null) {
      // Move dots toward the mean position
      const targetX = xScale(targetMean);
      const progress = animationPhase.progress;

      g.selectAll<SVGCircleElement, (typeof dotPositions)[0]>('.dot')
        .filter((d) => highlightedIndices.has(d.index))
        .attr('cx', (d) => d.x + (targetX - d.x) * progress)
        .attr('cy', (d) => d.y + (innerHeight - 10 - d.y) * progress);
    } else if (animationPhase.phase === 'drop') {
      // Dots converge and prepare to drop
      g.selectAll<SVGCircleElement, (typeof dotPositions)[0]>('.dot')
        .filter((d) => highlightedIndices.has(d.index))
        .attr('opacity', 1 - animationPhase.progress);
    }
  }, [
    animationPhase,
    currentSampleIndices,
    targetMean,
    xScale,
    innerHeight,
    dotPositions,
  ]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="population-display"
      role="img"
      aria-label="Population distribution histogram showing data points"
    >
      <text className="title" textAnchor="middle" fontSize="14" fontWeight="bold" />
      <g
        className="population-content"
        transform={`translate(${margin.left}, ${margin.top})`}
      />
    </svg>
  );
}
