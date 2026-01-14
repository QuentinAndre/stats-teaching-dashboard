import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface PopulationDotsProps {
  /** The population data points */
  populationData: number[];
  /** Indices of the sample points */
  sampleIndices: number[];
  /** Progress of highlighting animation (0-1) */
  highlightProgress: number;
  /** Population mean */
  mean?: number;
  /** Population standard deviation */
  std?: number;
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 400;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 50 };

export default function PopulationDots({
  populationData,
  sampleIndices,
  highlightProgress,
  mean = 50,
  std = 10,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: PopulationDotsProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // Calculate data range
  const dataRange = useMemo(() => {
    const buffer = std * 4;
    return {
      min: mean - buffer,
      max: mean + buffer,
    };
  }, [mean, std]);

  // Create scales
  const xScale = useMemo(
    () => d3.scaleLinear().domain([dataRange.min, dataRange.max]).range([0, innerWidth]),
    [dataRange, innerWidth]
  );

  // Calculate dot positions within histogram bins
  const dotPositions = useMemo(() => {
    if (populationData.length === 0) return [];

    const numBins = 50;
    const binWidth = (dataRange.max - dataRange.min) / numBins;
    const dotRadius = 3;
    const dotSpacing = dotRadius * 2.2;
    const dotsPerRow = Math.max(1, Math.floor((innerWidth / numBins - 2) / dotSpacing));

    // Group data indices by bin
    const binIndices: number[][] = Array.from({ length: numBins }, () => []);
    populationData.forEach((value, index) => {
      if (value >= dataRange.min && value < dataRange.max) {
        const binIndex = Math.min(
          numBins - 1,
          Math.max(0, Math.floor((value - dataRange.min) / binWidth))
        );
        binIndices[binIndex].push(index);
      }
    });

    // Calculate positions for each dot
    const positions: { index: number; x: number; y: number; value: number }[] = [];

    binIndices.forEach((indices, binIdx) => {
      const binX = xScale(dataRange.min + (binIdx + 0.5) * binWidth);

      indices.forEach((dataIndex, posInBin) => {
        const row = Math.floor(posInBin / dotsPerRow);
        const col = posInBin % dotsPerRow;
        const x = binX + (col - dotsPerRow / 2) * dotSpacing;
        const y = innerHeight - (row + 1) * dotSpacing;

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

  // Calculate how many dots to highlight based on progress
  const highlightedCount = Math.round(highlightProgress * sampleIndices.length);
  const highlightedIndices = useMemo(() => {
    return new Set(sampleIndices.slice(0, highlightedCount));
  }, [sampleIndices, highlightedCount]);

  // Draw the visualization
  useEffect(() => {
    if (!svgRef.current || dotPositions.length === 0) return;

    const svg = d3.select(svgRef.current);
    let g = svg.select<SVGGElement>('.population-content');

    // Create group if it doesn't exist
    if (g.empty()) {
      g = svg
        .append('g')
        .attr('class', 'population-content')
        .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);
    }

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    let axisGroup = g.select<SVGGElement>('.x-axis');
    if (axisGroup.empty()) {
      axisGroup = g
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${innerHeight})`);
    }
    axisGroup.call(xAxis);

    // Draw dots with data binding
    const dots = g
      .selectAll<SVGCircleElement, (typeof dotPositions)[0]>('.dot')
      .data(dotPositions, (d) => d.index.toString());

    // Enter new dots
    dots
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 3)
      .attr('fill', '#4361ee')
      .attr('opacity', 0.8);

    // Update existing dots - transition color based on highlight state
    g.selectAll<SVGCircleElement, (typeof dotPositions)[0]>('.dot')
      .transition()
      .duration(150)
      .attr('fill', (d) => (highlightedIndices.has(d.index) ? '#e63946' : '#4361ee'))
      .attr('r', (d) => (highlightedIndices.has(d.index) ? 4 : 3))
      .attr('opacity', (d) => (highlightedIndices.has(d.index) ? 1 : 0.7));

    // X-axis label
    let xLabel = g.select<SVGTextElement>('.x-label');
    if (xLabel.empty()) {
      xLabel = g
        .append('text')
        .attr('class', 'x-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 40)
        .attr('text-anchor', 'middle')
        .attr('fill', '#2d3436')
        .attr('font-size', '14px')
        .text('Value');
    }
  }, [dotPositions, highlightedIndices, xScale, innerHeight, innerWidth]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="population-dots"
      role="img"
      aria-label={`Population shown as dots. ${highlightedCount} of ${sampleIndices.length} sampled.`}
    />
  );
}
