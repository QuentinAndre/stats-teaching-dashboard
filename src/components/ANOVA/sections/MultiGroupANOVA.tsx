import { useState, useMemo, useCallback } from 'react';
import {
  oneWayANOVA,
  calculateGroupStatistics,
  fDistributionPDF,
} from '../../../utils/statistics';

export default function MultiGroupANOVA() {
  const [numGroups, setNumGroups] = useState(3);
  const [groupMeans, setGroupMeans] = useState([95, 100, 105, 110]);
  const [withinSD, setWithinSD] = useState(12);
  const [sampleSize, setSampleSize] = useState(15);
  const [dataSeed, setDataSeed] = useState(1);

  // Generate data with seeded random
  const groups = useMemo(() => {
    const seedRandom = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    };

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

    return Array.from({ length: numGroups }, (_, i) =>
      generateSeededNormal(sampleSize, groupMeans[i], withinSD, dataSeed * (i + 1) * 1000)
    );
  }, [numGroups, groupMeans, withinSD, sampleSize, dataSeed]);

  // Calculate ANOVA
  const anova = useMemo(() => oneWayANOVA(groups), [groups]);
  const stats = useMemo(() => calculateGroupStatistics(groups), [groups]);

  const isSignificant = anova.pValue < 0.05;

  const regenerateData = useCallback(() => {
    setDataSeed((s) => s + 1);
  }, []);

  const updateGroupMean = (index: number, value: number) => {
    setGroupMeans((prev) => {
      const newMeans = [...prev];
      newMeans[index] = value;
      return newMeans;
    });
  };

  // Colors for groups
  const groupColors = ['#4361ee', '#f4a261', '#e63946', '#2a9d8f'];
  const groupLabels = ['A', 'B', 'C', 'D'];

  // SVG dimensions
  const width = 700;
  const height = 300;
  const margin = { top: 30, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Calculate scales
  const visualData = useMemo(() => {
    const allValues = groups.flat();
    const yMin = Math.min(...allValues) - 10;
    const yMax = Math.max(...allValues) + 10;
    const yScale = (y: number) => plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

    const groupWidth = plotWidth / numGroups;

    // Create jittered points for each group
    const points = groups.flatMap((group, groupIdx) => {
      const baseX = groupWidth * groupIdx + groupWidth / 2;
      return group.map((value, i) => {
        const jitter = ((i * 7919 + groupIdx * 104729 + dataSeed * 15485863) % 1000) / 1000;
        return {
          x: baseX + (jitter - 0.5) * 50,
          y: yScale(value),
          value,
          groupIdx,
        };
      });
    });

    return {
      points,
      yScale,
      yMin,
      yMax,
      groupWidth,
      groupMeanYs: stats.means.map((m) => yScale(m)),
      grandMeanY: yScale(stats.grandMean),
    };
  }, [groups, stats, numGroups, plotWidth, plotHeight, dataSeed]);

  return (
    <div className="section-intro">
      <h2>Extending to Multiple Groups</h2>

      <p className="intro-text">
        Everything we've learned about ANOVA with two groups extends naturally to
        <strong> three or more groups</strong>. The logic is identical: partition variance
        into between-group and within-group components, then compare using the F-ratio.
      </p>

      <p className="intro-text">
        The key difference is interpretation: a significant F-test tells us that
        <strong> at least one group</strong> differs from the others—but not which ones.
        To determine specific group differences, we would need follow-up tests (post-hoc comparisons).
      </p>

      <div className="viz-container">
        <h4>Multi-Group ANOVA Demonstration</h4>

        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="num-groups-multi">Number of Groups</label>
            <input
              type="range"
              id="num-groups-multi"
              min="2"
              max="4"
              value={numGroups}
              onChange={(e) => setNumGroups(parseInt(e.target.value))}
            />
            <span className="control-value">{numGroups}</span>
          </div>
          <div className="control-group">
            <label htmlFor="within-sd-multi">Within-Group SD</label>
            <input
              type="range"
              id="within-sd-multi"
              min="5"
              max="25"
              value={withinSD}
              onChange={(e) => setWithinSD(parseInt(e.target.value))}
            />
            <span className="control-value">{withinSD}</span>
          </div>
          <div className="control-group">
            <label htmlFor="sample-size-multi">Sample Size (per group)</label>
            <input
              type="range"
              id="sample-size-multi"
              min="10"
              max="30"
              value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value))}
            />
            <span className="control-value">{sampleSize}</span>
          </div>
        </div>

        {/* Group mean sliders */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numGroups}, 1fr)`,
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)'
        }}>
          {Array.from({ length: numGroups }, (_, i) => (
            <div key={i} className="control-group" style={{ alignItems: 'center' }}>
              <label style={{ color: groupColors[i], fontWeight: 600 }}>
                Group {groupLabels[i]} Mean
              </label>
              <input
                type="range"
                min="80"
                max="120"
                value={groupMeans[i]}
                onChange={(e) => updateGroupMean(i, parseInt(e.target.value))}
                className={`slider-group-${groupLabels[i].toLowerCase()}`}
              />
              <span className="control-value">{groupMeans[i]}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-md)' }}>
          <button className="primary-button" onClick={regenerateData}>
            Generate New Data
          </button>
        </div>

        {/* Dot plot visualization */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ marginTop: 'var(--spacing-md)' }}>
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

            {/* Grand mean line */}
            <line
              x1={0}
              y1={visualData.grandMeanY}
              x2={plotWidth - 85}
              y2={visualData.grandMeanY}
              stroke="var(--text-secondary)"
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={0.6}
            />
            <text
              x={plotWidth - 5}
              y={visualData.grandMeanY + 4}
              fontSize={10}
              fill="var(--text-secondary)"
              textAnchor="end"
            >
              Grand Mean
            </text>

            {/* Group mean lines */}
            {stats.means.slice(0, numGroups).map((_, i) => {
              const baseX = visualData.groupWidth * i + visualData.groupWidth / 2;
              return (
                <line
                  key={`mean-${i}`}
                  x1={baseX - 35}
                  y1={visualData.groupMeanYs[i]}
                  x2={baseX + 35}
                  y2={visualData.groupMeanYs[i]}
                  stroke={groupColors[i]}
                  strokeWidth={3}
                />
              );
            })}

            {/* Data points */}
            {visualData.points.map((point, i) => (
              <circle
                key={`point-${i}`}
                cx={point.x}
                cy={point.y}
                r={5}
                fill={groupColors[point.groupIdx]}
                opacity={0.6}
                stroke="white"
                strokeWidth={1}
              />
            ))}

            {/* X-axis labels */}
            {Array.from({ length: numGroups }, (_, i) => {
              const baseX = visualData.groupWidth * i + visualData.groupWidth / 2;
              return (
                <g key={`label-${i}`}>
                  <text
                    x={baseX}
                    y={plotHeight + 20}
                    textAnchor="middle"
                    fontSize={12}
                    fill={groupColors[i]}
                    fontWeight={600}
                  >
                    Group {groupLabels[i]}
                  </text>
                  <text
                    x={baseX}
                    y={plotHeight + 35}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--text-secondary)"
                  >
                    X̄ = {stats.means[i].toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* ANOVA Summary Table */}
        <h4 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>
          ANOVA Summary Table
        </h4>
        <table className="anova-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>SS</th>
              <th>df</th>
              <th>MS</th>
              <th>F</th>
              <th>p</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Between Groups</td>
              <td>{anova.ssBetween.toFixed(2)}</td>
              <td>{anova.dfBetween}</td>
              <td>{anova.msBetween.toFixed(2)}</td>
              <td style={{ fontWeight: 600, color: isSignificant ? 'var(--accent)' : 'var(--text-primary)' }}>
                {anova.fStatistic.toFixed(3)}
              </td>
              <td style={{ color: isSignificant ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {anova.pValue < 0.001 ? '< .001' : anova.pValue.toFixed(3)}
              </td>
            </tr>
            <tr>
              <td>Within Groups</td>
              <td>{anova.ssWithin.toFixed(2)}</td>
              <td>{anova.dfWithin}</td>
              <td>{anova.msWithin.toFixed(2)}</td>
              <td></td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 600 }}>
              <td>Total</td>
              <td>{anova.ssTotal.toFixed(2)}</td>
              <td>{anova.dfTotal}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div className={`decision-indicator ${isSignificant ? 'reject' : 'fail-to-reject'}`}>
          {isSignificant
            ? `Significant effect: At least one group mean differs (F(${anova.dfBetween}, ${anova.dfWithin}) = ${anova.fStatistic.toFixed(2)}, p < .05)`
            : `No significant effect: Groups do not differ significantly (F(${anova.dfBetween}, ${anova.dfWithin}) = ${anova.fStatistic.toFixed(2)}, p ≥ .05)`}
        </div>

        {/* Variance bar */}
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Variance Partitioning</h4>
          <div className="variance-bar">
            <div
              className="variance-between"
              style={{ width: `${(anova.ssBetween / anova.ssTotal) * 100}%` }}
            >
              {((anova.ssBetween / anova.ssTotal) * 100).toFixed(0)}%
            </div>
            <div
              className="variance-within"
              style={{ width: `${(anova.ssWithin / anova.ssTotal) * 100}%` }}
            >
              {((anova.ssWithin / anova.ssTotal) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="variance-legend">
            <div className="legend-item">
              <div className="legend-color between"></div>
              <span>Between-groups ({((anova.ssBetween / anova.ssTotal) * 100).toFixed(1)}%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color within"></div>
              <span>Within-groups ({((anova.ssWithin / anova.ssTotal) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* F-distribution visualization */}
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>
            F-Distribution (df<sub>1</sub> = {anova.dfBetween}, df<sub>2</sub> = {anova.dfWithin})
          </h4>
          <svg width={500} height={150} viewBox="0 0 500 150" style={{ display: 'block', margin: '0 auto' }}>
            {(() => {
              const fMargin = { top: 15, right: 20, bottom: 35, left: 40 };
              const fPlotWidth = 500 - fMargin.left - fMargin.right;
              const fPlotHeight = 150 - fMargin.top - fMargin.bottom;
              const fMax = 10;
              const fixedMaxY = 0.8;

              // Generate F-distribution curve
              const points: { x: number; y: number }[] = [];
              for (let i = 0; i <= 100; i++) {
                const x = (i / 100) * fMax;
                const y = fDistributionPDF(x, anova.dfBetween, anova.dfWithin);
                points.push({ x, y });
              }

              const xScale = (x: number) => (x / fMax) * fPlotWidth;
              const yScale = (y: number) => fPlotHeight - (y / fixedMaxY) * fPlotHeight * 0.9;

              // Critical value (approximate)
              const fCritical = anova.dfBetween === 1 ? 4.0 :
                               anova.dfBetween === 2 ? 3.2 : 2.8;

              const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`).join(' ');

              // Rejection region
              const rejectionPoints = points.filter(p => p.x >= fCritical);
              const rejectionPath = rejectionPoints.length > 0
                ? `M ${xScale(fCritical)} ${fPlotHeight} ` +
                  rejectionPoints.map(p => `L ${xScale(p.x)} ${yScale(p.y)}`).join(' ') +
                  ` L ${xScale(fMax)} ${fPlotHeight} Z`
                : '';

              return (
                <g transform={`translate(${fMargin.left}, ${fMargin.top})`}>
                  {/* Rejection region */}
                  <path d={rejectionPath} fill="#e63946" opacity={0.15} />

                  {/* F-distribution curve */}
                  <path d={pathD} fill="none" stroke="#6c757d" strokeWidth={2} />

                  {/* X-axis */}
                  <line x1={0} y1={fPlotHeight} x2={fPlotWidth} y2={fPlotHeight} stroke="#adb5bd" />

                  {/* Critical value line */}
                  <line
                    x1={xScale(fCritical)}
                    y1={0}
                    x2={xScale(fCritical)}
                    y2={fPlotHeight}
                    stroke="#e63946"
                    strokeWidth={1.5}
                    strokeDasharray="4,2"
                  />
                  <text x={xScale(fCritical)} y={fPlotHeight + 25} textAnchor="middle" fontSize={9} fill="#e63946">
                    F_crit ≈ {fCritical.toFixed(1)}
                  </text>

                  {/* Observed F value */}
                  {anova.fStatistic <= fMax && (
                    <>
                      <line
                        x1={xScale(anova.fStatistic)}
                        y1={0}
                        x2={xScale(anova.fStatistic)}
                        y2={fPlotHeight}
                        stroke={isSignificant ? '#e63946' : '#4361ee'}
                        strokeWidth={2}
                      />
                      <circle
                        cx={xScale(anova.fStatistic)}
                        cy={10}
                        r={5}
                        fill={isSignificant ? '#e63946' : '#4361ee'}
                      />
                      <text
                        x={xScale(anova.fStatistic)}
                        y={-2}
                        textAnchor="middle"
                        fontSize={10}
                        fill={isSignificant ? '#e63946' : '#4361ee'}
                        fontWeight={600}
                      >
                        F = {anova.fStatistic.toFixed(2)}
                      </text>
                    </>
                  )}

                  {/* X-axis labels */}
                  {[0, 2, 4, 6, 8, 10].map(tick => (
                    <text key={tick} x={xScale(tick)} y={fPlotHeight + 12} textAnchor="middle" fontSize={9} fill="#6c757d">
                      {tick}
                    </text>
                  ))}

                  {/* Alpha label */}
                  <text x={xScale(7.5)} y={25} fontSize={9} fill="#e63946">
                    α = .05
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-md)', marginTop: 'var(--spacing-lg)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>What to Explore</h4>
        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <li>
            <strong>Move one group's mean away from the others</strong>: Watch how a single
            outlying group can drive the F-statistic up.
          </li>
          <li>
            <strong>Make all group means equal</strong>: The F-statistic should hover
            around 1, and most tests will be non-significant.
          </li>
          <li>
            <strong>Increase within-group SD</strong>: The same group differences become
            harder to detect as noise increases.
          </li>
          <li>
            <strong>Add more groups</strong>: Notice how degrees of freedom change
            (df<sub>between</sub> = k − 1, df<sub>within</sub> = N − k).
          </li>
        </ul>
      </div>

      <div className="key-insight">
        <h4>Interpreting Multi-Group Results</h4>
        <p>
          Remember: a significant ANOVA tells you that <em>at least one</em> group differs,
          not which specific groups differ. To identify pairwise differences, researchers
          use follow-up tests like Tukey's HSD or planned contrasts. The ANOVA serves as
          an "omnibus" test—a gatekeeper that controls the overall Type I error rate.
        </p>
      </div>
    </div>
  );
}
