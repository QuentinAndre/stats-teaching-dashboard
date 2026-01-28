import { useState, useMemo, useCallback } from 'react';
import {
  computeSumOfSquares,
  calculateGroupStatistics,
} from '../../../utils/statistics';

type AnimationPhase = 'total' | 'groups' | 'decomposed';

export default function VariancePartitioning() {
  const [phase, setPhase] = useState<AnimationPhase>('total');
  const [groupSeparation, setGroupSeparation] = useState(10); // Distance between group means
  const [withinVariability, setWithinVariability] = useState(15); // SD within groups
  const [dataSeed, setDataSeed] = useState(1);

  const sampleSize = 12; // Per group
  const grandMeanBase = 100;

  // Generate data based on parameters
  const data = useMemo(() => {
    // Use seed for reproducible data
    const seedRandom = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    };

    // Box-Muller with seeded random
    const generateSeededNormal = (n: number, mean: number, sd: number, seed: number): number[] => {
      const rand = seedRandom(seed);
      const values: number[] = [];
      for (let i = 0; i < n; i++) {
        const u1 = rand();
        const u2 = rand();
        const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
        values.push(mean + sd * z);
      }
      return values;
    };

    const mean1 = grandMeanBase - groupSeparation / 2;
    const mean2 = grandMeanBase + groupSeparation / 2;

    const group1 = generateSeededNormal(sampleSize, mean1, withinVariability, dataSeed * 1000);
    const group2 = generateSeededNormal(sampleSize, mean2, withinVariability, dataSeed * 2000);

    return { group1, group2 };
  }, [groupSeparation, withinVariability, dataSeed]);

  // Calculate statistics
  const stats = useMemo(() => {
    const groups = [data.group1, data.group2];
    const groupStats = calculateGroupStatistics(groups);
    const ss = computeSumOfSquares(groups);

    return {
      ...groupStats,
      ...ss,
      allData: [...data.group1, ...data.group2],
    };
  }, [data]);

  // Regenerate data
  const regenerateData = useCallback(() => {
    setDataSeed((s) => s + 1);
    setPhase('total');
  }, []);

  // SVG dimensions
  const width = 700;
  const height = 350;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scales
  const visualData = useMemo(() => {
    const allValues = stats.allData;
    const yMin = Math.min(...allValues) - 10;
    const yMax = Math.max(...allValues) + 10;

    const yScale = (y: number) =>
      plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

    // X positions for points - moved towards center
    const group1X = plotWidth * 0.3;
    const group2X = plotWidth * 0.7;

    // Jitter for points (seeded) - spread points across the group area
    const jitterSeed = (i: number, group: number) => {
      const s = (i * 7919 + group * 104729 + dataSeed * 15485863) % 1000;
      return ((s / 1000) - 0.5) * 100;
    };

    const points = [
      ...data.group1.map((v, i) => ({
        x: group1X + jitterSeed(i, 0),
        y: yScale(v),
        value: v,
        group: 0,
        groupMean: stats.means[0],
      })),
      ...data.group2.map((v, i) => ({
        x: group2X + jitterSeed(i, 1),
        y: yScale(v),
        value: v,
        group: 1,
        groupMean: stats.means[1],
      })),
    ];

    return {
      points,
      yScale,
      yMin,
      yMax,
      grandMeanY: yScale(stats.grandMean),
      group1MeanY: yScale(stats.means[0]),
      group2MeanY: yScale(stats.means[1]),
      group1X,
      group2X,
    };
  }, [stats, data, dataSeed, plotWidth, plotHeight]);

  // Colors - using purple/green for variance to avoid confusion with group colors (blue/orange)
  const groupColors = ['#4361ee', '#f4a261'];
  const betweenColor = '#8b5cf6';  // Purple for between-group variance
  const withinColor = '#10b981';   // Green for within-group variance

  return (
    <div className="section-intro">
      <h2>Where Does the Variability Come From?</h2>

      <p className="intro-text">
        This is the heart of ANOVA: <strong>partitioning variance</strong>. Every observation
        in our dataset deviates from the overall average (the grand mean). ANOVA asks:
        how much of this deviation is due to <em>group membership</em> versus
        <em>individual differences within groups</em>?
      </p>

      <div className="formula-box">
        <h3>The Fundamental Partition</h3>
        <div className="formula">
          <span className="formula-main">SS<sub>Total</sub> = SS<sub>Between</sub> + SS<sub>Within</sub></span>
        </div>
        <div className="formula-parts">
          <div className="formula-part">
            <span className="symbol">SS<sub>Total</sub></span>
            <span className="explanation">
              Total variability: sum of squared deviations of all observations from the grand mean
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Between</sub></span>
            <span className="explanation">
              Between-group variability: how much group means differ from the grand mean
            </span>
          </div>
          <div className="formula-part">
            <span className="symbol">SS<sub>Within</sub></span>
            <span className="explanation">
              Within-group variability: how much individuals vary within their own groups
            </span>
          </div>
        </div>
      </div>

      <h3>The Three Steps of Decomposition</h3>

      <p className="intro-text">
        Watch how ANOVA breaks down total variance into its components:
      </p>

      {/* Sequential Three-Step Demonstration */}
      {(() => {
        // Consistent data points across all three steps
        const group1Y = [30, 40, 50, 55]; // Group 1 points (above grand mean)
        const group2Y = [65, 75, 80, 90]; // Group 2 points (below grand mean)
        const grandMeanY = 60;
        const group1MeanY = 44; // Mean of group 1
        const group2MeanY = 77; // Mean of group 2
        const group1X = [50, 70, 90, 110]; // x positions for group 1
        const group2X = [190, 210, 230, 250]; // x positions for group 2
        const offset = 2;

        return (
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            {/* Step 1: Total Variance */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', color: '#6c757d' }}>
                Step 1: Total Variance
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="350" height="140" viewBox="0 0 350 140">
                  <line x1="30" y1={grandMeanY} x2="280" y2={grandMeanY} stroke="#6c757d" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="290" y={grandMeanY + 4} fontSize="11" fill="#6c757d">Grand Mean</text>
                  {/* Group 1 points with deviation lines - all gray */}
                  {group1Y.map((y, i) => (
                    <g key={i}>
                      <line x1={group1X[i]} y1={y} x2={group1X[i]} y2={grandMeanY} stroke="#6c757d" strokeWidth="1.5" opacity="0.5" />
                      <circle cx={group1X[i]} cy={y} r="6" fill="#6c757d" />
                    </g>
                  ))}
                  {/* Group 2 points with deviation lines - all gray */}
                  {group2Y.map((y, i) => (
                    <g key={i + 4}>
                      <line x1={group2X[i]} y1={y} x2={group2X[i]} y2={grandMeanY} stroke="#6c757d" strokeWidth="1.5" opacity="0.5" />
                      <circle cx={group2X[i]} cy={y} r="6" fill="#6c757d" />
                    </g>
                  ))}
                </svg>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', marginTop: 'var(--spacing-md)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  All observations are shown as gray dots. Each vertical line shows how far that
                  observation deviates from the <strong>grand mean</strong> (the average of all data points).
                  The sum of these squared deviations is <strong>SS<sub>Total</sub></strong>.
                </p>
              </div>
            </div>

            {/* Step 2: Reveal Groups */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', color: 'var(--primary)' }}>
                Step 2: Reveal Groups
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="350" height="140" viewBox="0 0 350 140">
                  <line x1="30" y1={grandMeanY} x2="280" y2={grandMeanY} stroke="#6c757d" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
                  {/* Group means */}
                  <line x1="35" y1={group1MeanY} x2="125" y2={group1MeanY} stroke="#4361ee" strokeWidth="3" />
                  <line x1="175" y1={group2MeanY} x2="265" y2={group2MeanY} stroke="#f4a261" strokeWidth="3" />
                  {/* Group labels */}
                  <text x="80" y="125" textAnchor="middle" fontSize="11" fill="#4361ee" fontWeight="600">Group 1</text>
                  <text x="220" y="125" textAnchor="middle" fontSize="11" fill="#f4a261" fontWeight="600">Group 2</text>
                  {/* Group 1 points - colored, no deviation lines */}
                  {group1Y.map((y, i) => (
                    <g key={i}>
                      <circle cx={group1X[i]} cy={y} r="6" fill="#4361ee" />
                    </g>
                  ))}
                  {/* Group 2 points - colored, no deviation lines */}
                  {group2Y.map((y, i) => (
                    <g key={i + 4}>
                      <circle cx={group2X[i]} cy={y} r="6" fill="#f4a261" />
                    </g>
                  ))}
                </svg>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', marginTop: 'var(--spacing-md)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Now we color the points by group and show each <strong>group mean</strong>.
                  Notice that the group means differ from the grand mean—this is the "between-group"
                  variation we want to detect.
                </p>
              </div>
            </div>

            {/* Step 3: Decompose */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: 'var(--spacing-lg)',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-md) 0', fontSize: '1rem', color: '#e63946' }}>
                Step 3: Decompose
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="350" height="140" viewBox="0 0 350 140">
                  <line x1="30" y1={grandMeanY} x2="280" y2={grandMeanY} stroke="#6c757d" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
                  {/* Group means */}
                  <line x1="35" y1={group1MeanY} x2="125" y2={group1MeanY} stroke="#4361ee" strokeWidth="3" />
                  <line x1="175" y1={group2MeanY} x2="265" y2={group2MeanY} stroke="#f4a261" strokeWidth="3" />
                  {/* Group labels */}
                  <text x="80" y="125" textAnchor="middle" fontSize="11" fill="#4361ee" fontWeight="600">Group 1</text>
                  <text x="220" y="125" textAnchor="middle" fontSize="11" fill="#f4a261" fontWeight="600">Group 2</text>
                  {/* Group 1 decomposition - with offset for visibility */}
                  {group1Y.map((y, i) => {
                    const x = group1X[i];
                    return (
                      <g key={i}>
                        {/* Between: group mean to grand mean */}
                        <line x1={x - offset} y1={group1MeanY} x2={x - offset} y2={grandMeanY} stroke="#8b5cf6" strokeWidth="3" opacity="0.8" />
                        {/* Within: point to group mean */}
                        <line x1={x + offset} y1={y} x2={x + offset} y2={group1MeanY} stroke="#10b981" strokeWidth="3" opacity="0.8" />
                        <circle cx={x} cy={y} r="6" fill="#4361ee" />
                      </g>
                    );
                  })}
                  {/* Group 2 decomposition - with offset for visibility */}
                  {group2Y.map((y, i) => {
                    const x = group2X[i];
                    return (
                      <g key={i + 4}>
                        {/* Between: group mean to grand mean */}
                        <line x1={x - offset} y1={group2MeanY} x2={x - offset} y2={grandMeanY} stroke="#8b5cf6" strokeWidth="3" opacity="0.8" />
                        {/* Within: point to group mean */}
                        <line x1={x + offset} y1={y} x2={x + offset} y2={group2MeanY} stroke="#10b981" strokeWidth="3" opacity="0.8" />
                        <circle cx={x} cy={y} r="6" fill="#f4a261" />
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <div style={{ width: '20px', height: '4px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Between-groups (SS<sub>B</sub>)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <div style={{ width: '20px', height: '4px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Within-groups (SS<sub>W</sub>)</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  The Total Variance in the sample is now split into two parts:
                </p>
                <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0, fontSize: '0.875rem' }}>
                  <li><strong style={{ color: '#8b5cf6' }}>Purple (Between)</strong>: Distance from group mean to grand mean, reflecting the amount of variance explained by the group membership.</li>
                  <li><strong style={{ color: '#10b981' }}>Green (Within)</strong>: Distance from observation to group mean, reflecting the amount of individual variation within each group.</li>
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      <h3>Explore It Yourself</h3>

      <p className="intro-text">
        Now try manipulating the parameters to see how they affect the variance partition:
      </p>

      <div className="viz-container">
        <h4>Variance Decomposition Visualization</h4>

        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="group-separation">Group Mean Difference</label>
            <input
              type="range"
              id="group-separation"
              min="0"
              max="30"
              value={groupSeparation}
              onChange={(e) => {
                setGroupSeparation(parseInt(e.target.value));
                setPhase('total');
              }}
            />
            <span className="control-value">{groupSeparation}</span>
          </div>
          <div className="control-group">
            <label htmlFor="within-variability">Within-Group SD</label>
            <input
              type="range"
              id="within-variability"
              min="5"
              max="30"
              value={withinVariability}
              onChange={(e) => {
                setWithinVariability(parseInt(e.target.value));
                setPhase('total');
              }}
            />
            <span className="control-value">{withinVariability}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="primary-button" onClick={regenerateData}>
              New Data
            </button>
          </div>
        </div>

        {/* Phase buttons */}
        <div className="phase-buttons">
          <button
            className={`phase-button ${phase === 'total' ? 'active' : ''}`}
            onClick={() => setPhase('total')}
          >
            1. Total Variance
          </button>
          <button
            className={`phase-button ${phase === 'groups' ? 'active' : ''}`}
            onClick={() => setPhase('groups')}
          >
            2. Reveal Groups
          </button>
          <button
            className={`phase-button ${phase === 'decomposed' ? 'active' : ''}`}
            onClick={() => setPhase('decomposed')}
          >
            3. Decompose
          </button>
        </div>

        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />

            {/* Y-axis ticks */}
            {[visualData.yMin, (visualData.yMin + visualData.yMax) / 2, visualData.yMax].map((tick, i) => (
              <g key={i} transform={`translate(0, ${visualData.yScale(tick)})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                  {tick.toFixed(0)}
                </text>
              </g>
            ))}

            {/* Grand mean line (always visible) */}
            <line
              x1={0}
              y1={visualData.grandMeanY}
              x2={plotWidth - 85}
              y2={visualData.grandMeanY}
              stroke="var(--text-secondary)"
              strokeWidth={2}
              strokeDasharray={phase === 'total' ? 'none' : '6,4'}
              opacity={phase === 'total' ? 1 : 0.6}
            />
            <text
              x={plotWidth - 5}
              y={visualData.grandMeanY + 4}
              fontSize={11}
              fill="var(--text-secondary)"
              fontWeight={600}
              textAnchor="end"
            >
              Grand Mean
            </text>

            {/* Group mean lines (phases 2 and 3) */}
            {(phase === 'groups' || phase === 'decomposed') && (
              <>
                <line
                  x1={visualData.group1X - 65}
                  y1={visualData.group1MeanY}
                  x2={visualData.group1X + 65}
                  y2={visualData.group1MeanY}
                  stroke={groupColors[0]}
                  strokeWidth={3}
                />
                <line
                  x1={visualData.group2X - 65}
                  y1={visualData.group2MeanY}
                  x2={visualData.group2X + 65}
                  y2={visualData.group2MeanY}
                  stroke={groupColors[1]}
                  strokeWidth={3}
                />
              </>
            )}

            {/* Deviation lines */}
            {visualData.points.map((point, i) => {
              const grandMeanY = visualData.grandMeanY;
              const groupMeanY = point.group === 0 ? visualData.group1MeanY : visualData.group2MeanY;
              const pointY = point.y;

              if (phase === 'total') {
                // Total deviation: point to grand mean
                return (
                  <line
                    key={`dev-${i}`}
                    x1={point.x}
                    y1={pointY}
                    x2={point.x}
                    y2={grandMeanY}
                    stroke="var(--text-secondary)"
                    strokeWidth={1}
                    opacity={0.4}
                  />
                );
              } else if (phase === 'groups') {
                // No deviation lines in the "Reveal Groups" phase - just show colored points
                return null;
              } else {
                // Decomposed: show both between and within components
                // Between: group mean to grand mean (systematic group difference)
                // Within: point to group mean (individual variation)
                const lineOffset = 1;
                return (
                  <g key={`dev-${i}`}>
                    {/* Between component: from group mean to grand mean (purple) - left of center */}
                    <line
                      x1={point.x - lineOffset}
                      y1={groupMeanY}
                      x2={point.x - lineOffset}
                      y2={grandMeanY}
                      stroke={betweenColor}
                      strokeWidth={3}
                      opacity={0.8}
                    />
                    {/* Within component: from point to group mean (green) - right of center */}
                    <line
                      x1={point.x + lineOffset}
                      y1={pointY}
                      x2={point.x + lineOffset}
                      y2={groupMeanY}
                      stroke={withinColor}
                      strokeWidth={3}
                      opacity={0.8}
                    />
                  </g>
                );
              }
            })}

            {/* Data points */}
            {visualData.points.map((point, i) => (
              <circle
                key={`point-${i}`}
                cx={point.x}
                cy={point.y}
                r={6}
                fill={phase === 'total' ? 'var(--text-secondary)' : groupColors[point.group]}
                stroke="white"
                strokeWidth={1.5}
                opacity={0.9}
              />
            ))}

            {/* X-axis labels */}
            {phase !== 'total' && (
              <>
                <text
                  x={visualData.group1X}
                  y={plotHeight + 25}
                  textAnchor="middle"
                  fontSize={13}
                  fill={groupColors[0]}
                  fontWeight={600}
                >
                  Group 1
                </text>
                <text
                  x={visualData.group1X}
                  y={plotHeight + 40}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  X̄ = {stats.means[0].toFixed(1)}
                </text>
                <text
                  x={visualData.group2X}
                  y={plotHeight + 25}
                  textAnchor="middle"
                  fontSize={13}
                  fill={groupColors[1]}
                  fontWeight={600}
                >
                  Group 2
                </text>
                <text
                  x={visualData.group2X}
                  y={plotHeight + 40}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                >
                  X̄ = {stats.means[1].toFixed(1)}
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Variance legend */}
        {phase === 'decomposed' && (
          <div className="variance-legend">
            <div className="legend-item">
              <div className="legend-color between"></div>
              <span>Between-groups (SS<sub>B</sub>)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color within"></div>
              <span>Within-groups (SS<sub>W</sub>)</span>
            </div>
          </div>
        )}

        {/* SS values display */}
        <div className="results-row" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="result-card" style={{ opacity: 1 }}>
            <div className="result-label">SS<sub>Total</sub></div>
            <div className="result-value">{stats.ssTotal.toFixed(1)}</div>
          </div>
          <div className="result-card" style={{ opacity: phase === 'decomposed' ? 1 : 0.3 }}>
            <div className="result-label">SS<sub>Between</sub></div>
            <div className="result-value" style={{ color: betweenColor }}>
              {stats.ssBetween.toFixed(1)}
            </div>
          </div>
          <div className="result-card" style={{ opacity: phase === 'decomposed' ? 1 : 0.3 }}>
            <div className="result-label">SS<sub>Within</sub></div>
            <div className="result-value" style={{ color: withinColor }}>
              {stats.ssWithin.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Variance bar */}
        {phase === 'decomposed' && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="variance-bar">
              <div
                className="variance-between"
                style={{ width: `${(stats.ssBetween / stats.ssTotal) * 100}%` }}
              >
                {((stats.ssBetween / stats.ssTotal) * 100).toFixed(0)}%
              </div>
              <div
                className="variance-within"
                style={{ width: `${(stats.ssWithin / stats.ssTotal) * 100}%` }}
              >
                {((stats.ssWithin / stats.ssTotal) * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              SS<sub>Between</sub> + SS<sub>Within</sub> = {stats.ssBetween.toFixed(1)} + {stats.ssWithin.toFixed(1)} = {(stats.ssBetween + stats.ssWithin).toFixed(1)} = SS<sub>Total</sub> ✓
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>What to Explore</h4>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li>
            <strong>Increase "Group Mean Difference"</strong>: Watch SS<sub>Between</sub> grow as the "signal" gets stronger.
          </li>
          <li>
            <strong>Increase "Within-Group SD"</strong>: Watch SS<sub>Within</sub> grow as the "noise" increases.
          </li>
          <li>
            <strong>Step through the phases</strong>: See how total variance is systematically partitioned.
          </li>
        </ul>
      </div>
    </div>
  );
}
