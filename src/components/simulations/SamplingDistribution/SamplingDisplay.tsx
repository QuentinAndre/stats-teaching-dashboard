import { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as d3 from 'd3';
import type { RootState } from '../../../store';
import type { AnimationPhase, SimulationDimensions } from './types';
import { SAMPLE_MEANS_DIMENSIONS, STICK_WIDTH, STICK_HEIGHT_RATIO } from './types';

interface SamplingDisplayProps {
  animationPhase: AnimationPhase;
  targetMean: number | null;
  dimensions?: SimulationDimensions;
  xDomain: { min: number; max: number };
}

export default function SamplingDisplay({
  animationPhase,
  targetMean,
  dimensions = SAMPLE_MEANS_DIMENSIONS,
  xDomain,
}: SamplingDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    sampleMeans,
    populationMean,
    sampleSize,
    numberOfSamples,
  } = useSelector((state: RootState) => state.sampling);

  const { width, height, margin } = dimensions;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Calculate stick height based on inner height
  const stickHeight = innerHeight * STICK_HEIGHT_RATIO;

  // Use shared xDomain for x-axis alignment with PopulationDisplay
  const xScale = useMemo(
    () => d3.scaleLinear().domain([xDomain.min, xDomain.max]).range([0, innerWidth]),
    [xDomain, innerWidth]
  );

  // Draw the visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.sampling-content');

    // Clear previous content
    g.selectAll('*').remove();

    // Draw x-axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    // Draw rugplot sticks for each sample mean
    if (sampleMeans.length > 0) {
      sampleMeans.forEach((mean) => {
        const xPos = xScale(mean);

        g.append('rect')
          .attr('class', 'rugplot-stick')
          .attr('x', xPos - STICK_WIDTH / 2)
          .attr('y', innerHeight - stickHeight)
          .attr('width', STICK_WIDTH)
          .attr('height', stickHeight)
          .attr('fill', '#4361ee')
          .attr('opacity', 0.6);
      });
    }

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

    // Label for mean
    g.append('text')
      .attr('x', xScale(populationMean))
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#2d3436')
      .attr('font-size', '12px')
      .text(`μ = ${populationMean.toFixed(1)}`);

    // Title
    svg
      .select('.title')
      .attr('x', width / 2)
      .attr('y', 15)
      .text(`Sample Means (n = ${sampleSize})`);

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 150}, 5)`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', STICK_WIDTH)
      .attr('height', 15)
      .attr('fill', '#4361ee')
      .attr('opacity', 0.6);

    legend
      .append('text')
      .attr('x', 10)
      .attr('y', 12)
      .attr('font-size', '11px')
      .text(`Sample Means (${sampleMeans.length}/${numberOfSamples})`);
  }, [
    sampleMeans,
    xScale,
    innerHeight,
    innerWidth,
    width,
    populationMean,
    sampleSize,
    numberOfSamples,
    stickHeight,
  ]);

  // Animate dropping stick
  useEffect(() => {
    if (
      !svgRef.current ||
      animationPhase.phase !== 'drop' ||
      targetMean === null
    )
      return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('.sampling-content');

    // Remove any existing animated stick
    g.selectAll('.animated-stick').remove();

    // Create animated stick dropping in
    const targetX = xScale(targetMean);
    const startY = -stickHeight;
    const endY = innerHeight - stickHeight;
    const currentY = startY + (endY - startY) * animationPhase.progress;

    g.append('rect')
      .attr('class', 'animated-stick')
      .attr('x', targetX - STICK_WIDTH / 2)
      .attr('y', currentY)
      .attr('width', STICK_WIDTH)
      .attr('height', stickHeight)
      .attr('fill', '#e63946')
      .attr('opacity', 1);
  }, [animationPhase, targetMean, xScale, innerHeight, stickHeight]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="sampling-display"
      role="img"
      aria-label="Sample means distribution"
    >
      <text className="title" textAnchor="middle" fontSize="14" fontWeight="bold" />
      <g
        className="sampling-content"
        transform={`translate(${margin.left}, ${margin.top})`}
      />
    </svg>
  );
}
