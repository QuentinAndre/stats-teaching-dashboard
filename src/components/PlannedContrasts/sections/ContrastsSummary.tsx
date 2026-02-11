import { useState, useMemo, useCallback } from 'react';
import {
  oneWayANOVA,
  calculateGroupStatistics,
  contrastFTest,
  areContrastsOrthogonal,
  validateContrastWeights,
} from '../../../utils/statistics';

const GROUP_LABELS = ['CBT', 'Behavioral', 'Wait-list'];
const GROUP_COLORS = ['#4361ee', '#f4a261', '#e63946'];

const PRESETS: { label: string; w1: number[]; w2: number[] }[] = [
  { label: 'Therapy vs. Control + CBT vs. Behav.', w1: [1, 1, -2], w2: [1, -1, 0] },
  { label: 'CBT vs. Control + Behav. vs. Control', w1: [1, 0, -1], w2: [0, 1, -1] },
];

export default function ContrastsSummary() {
  const [groupMeans, setGroupMeans] = useState([85, 79, 68]);
  const [withinSD, setWithinSD] = useState(12);
  const [sampleSize, setSampleSize] = useState(15);
  const [dataSeed, setDataSeed] = useState(1);

  const [weights1, setWeights1] = useState([1, 1, -2]);
  const [weights2, setWeights2] = useState([1, -1, 0]);

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

    return Array.from({ length: 3 }, (_, i) =>
      generateSeededNormal(sampleSize, groupMeans[i], withinSD, dataSeed * (i + 1) * 1000)
    );
  }, [groupMeans, withinSD, sampleSize, dataSeed]);

  const anova = useMemo(() => oneWayANOVA(groups), [groups]);
  const stats = useMemo(() => calculateGroupStatistics(groups), [groups]);
  const observedMeans = stats.means;

  const validation1 = useMemo(() => validateContrastWeights(weights1), [weights1]);
  const validation2 = useMemo(() => validateContrastWeights(weights2), [weights2]);

  const orthogonality = useMemo(
    () => areContrastsOrthogonal(weights1, weights2),
    [weights1, weights2]
  );

  const contrast1 = useMemo(
    () => contrastFTest(weights1, observedMeans, sampleSize, anova.msWithin, anova.dfWithin),
    [weights1, observedMeans, sampleSize, anova.msWithin, anova.dfWithin]
  );

  const contrast2 = useMemo(
    () => contrastFTest(weights2, observedMeans, sampleSize, anova.msWithin, anova.dfWithin),
    [weights2, observedMeans, sampleSize, anova.msWithin, anova.dfWithin]
  );

  const omnibusSignificant = anova.pValue < 0.05;
  const contrast1Significant = contrastResult1Sig();
  const contrast2Significant = contrastResult2Sig();

  function contrastResult1Sig() {
    return contrast1.pValue < 0.05;
  }
  function contrastResult2Sig() {
    return contrast2.pValue < 0.05;
  }

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

  const handleWeight1Change = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setWeights1((prev) => {
      const newWeights = [...prev];
      newWeights[index] = isNaN(parsed) ? 0 : parsed;
      return newWeights;
    });
  };

  const handleWeight2Change = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setWeights2((prev) => {
      const newWeights = [...prev];
      newWeights[index] = isNaN(parsed) ? 0 : parsed;
      return newWeights;
    });
  };

  const handlePresetChange = (presetIndex: number) => {
    setWeights1([...PRESETS[presetIndex].w1]);
    setWeights2([...PRESETS[presetIndex].w2]);
  };

  // SVG dot plot
  const width = 700;
  const height = 280;
  const margin = { top: 30, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const visualData = useMemo(() => {
    const allValues = groups.flat();
    const yMin = Math.min(...allValues) - 10;
    const yMax = Math.max(...allValues) + 10;
    const yScale = (y: number) => plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;
    const groupWidth = plotWidth / 3;

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

    return { points, yScale, yMin, yMax, groupWidth, groupMeanYs: stats.means.map((m) => yScale(m)), grandMeanY: yScale(stats.grandMean) };
  }, [groups, stats, plotWidth, plotHeight, dataSeed]);

  // SS partition
  const ssPartition = useMemo(() => {
    const ssA = anova.ssBetween;
    if (ssA <= 0) return { ss1Pct: 0, ss2Pct: 0, remainderPct: 100 };
    const ss1Pct = Math.max(0, Math.min(100, (contrast1.ssContrast / ssA) * 100));
    const ss2Pct = Math.max(0, Math.min(100 - ss1Pct, (contrast2.ssContrast / ssA) * 100));
    const remainderPct = Math.max(0, 100 - ss1Pct - ss2Pct);
    return { ss1Pct, ss2Pct, remainderPct };
  }, [contrast1.ssContrast, contrast2.ssContrast, anova.ssBetween]);

  return (
    <div className="section-intro">
      <h2>Putting It Together</h2>

      <p className="intro-text">
        This workbench combines everything from the previous sections. Adjust the data, define
        two contrasts, and observe the complete ANOVA table with contrast rows, the SS
        decomposition, and the orthogonality check all in one place.
      </p>

      <div className="viz-container">
        <h4>Contrast Workbench</h4>

        {/* Data controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)',
        }}>
          <div className="control-group" style={{ gap: '2px' }}>
            <label>Within-group SD</label>
            <input type="range" min="5" max="25" value={withinSD}
              onChange={(e) => setWithinSD(parseInt(e.target.value))} />
            <span className="control-value">{withinSD}</span>
          </div>
          <div className="control-group" style={{ gap: '2px' }}>
            <label>n per group</label>
            <input type="range" min="5" max="30" value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value))} />
            <span className="control-value">{sampleSize}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginTop: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)',
        }}>
          {GROUP_LABELS.map((label, i) => (
            <div key={i} className="control-group" style={{ gap: '2px', flex: 1 }}>
              <label style={{ color: GROUP_COLORS[i], fontWeight: 600, fontSize: '0.8125rem' }}>
                {label} Mean
              </label>
              <input type="range" min="50" max="100" value={groupMeans[i]}
                onChange={(e) => updateGroupMean(i, parseInt(e.target.value))} />
              <span className="control-value">{groupMeans[i]}</span>
            </div>
          ))}
          <button className="primary-button" onClick={regenerateData} style={{ whiteSpace: 'nowrap' }}>
            New Data
          </button>
        </div>

        {/* Dot plot */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
          style={{ marginTop: 'var(--spacing-md)', maxWidth: '100%' }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />
            {[visualData.yMin, (visualData.yMin + visualData.yMax) / 2, visualData.yMax].map((tick, i) => (
              <g key={i} transform={`translate(0, ${visualData.yScale(tick)})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="var(--border)" />
                <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                  {tick.toFixed(0)}
                </text>
              </g>
            ))}
            <line
              x1={0} y1={visualData.grandMeanY}
              x2={plotWidth - 85} y2={visualData.grandMeanY}
              stroke="var(--text-secondary)" strokeWidth={2}
              strokeDasharray="6,4" opacity={0.6}
            />
            {stats.means.slice(0, 3).map((_, i) => {
              const baseX = visualData.groupWidth * i + visualData.groupWidth / 2;
              return (
                <line key={`mean-${i}`}
                  x1={baseX - 35} y1={visualData.groupMeanYs[i]}
                  x2={baseX + 35} y2={visualData.groupMeanYs[i]}
                  stroke={GROUP_COLORS[i]} strokeWidth={3}
                />
              );
            })}
            {visualData.points.map((point, i) => (
              <circle key={`point-${i}`}
                cx={point.x} cy={point.y} r={4}
                fill={GROUP_COLORS[point.groupIdx]}
                opacity={0.5} stroke="white" strokeWidth={1}
              />
            ))}
            {GROUP_LABELS.map((label, i) => {
              const baseX = visualData.groupWidth * i + visualData.groupWidth / 2;
              return (
                <g key={`label-${i}`}>
                  <text x={baseX} y={plotHeight + 20} textAnchor="middle"
                    fontSize={12} fill={GROUP_COLORS[i]} fontWeight={600}>
                    {label}
                  </text>
                  <text x={baseX} y={plotHeight + 35} textAnchor="middle"
                    fontSize={10} fill="var(--text-secondary)">
                    Y&#772; = {observedMeans[i].toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Contrast weight controls with presets */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-md)',
          flexWrap: 'wrap',
        }}>
          <select className="contrast-presets" onChange={(e) => handlePresetChange(parseInt(e.target.value))}>
            {PRESETS.map((preset, i) => (
              <option key={i} value={i}>{preset.label}</option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 'var(--spacing-sm)',
          alignItems: 'center',
          marginTop: 'var(--spacing-md)',
        }}>
          {/* Contrast 1 */}
          <div style={{
            padding: 'var(--spacing-sm)',
            background: 'rgba(67, 97, 238, 0.05)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid #4361ee',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4361ee', textAlign: 'center', marginBottom: '4px' }}>
              ψ₁ [{weights1.join(', ')}]
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {GROUP_LABELS.map((_, i) => (
                <input key={i} type="number" className="contrast-weight-input"
                  style={{ width: '50px', fontSize: '0.875rem' }}
                  value={weights1[i]}
                  onChange={(e) => handleWeight1Change(i, e.target.value)} step={1} />
              ))}
            </div>
            {validation1.isValid && (
              <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#4361ee', marginTop: '4px' }}>
                ψ&#770; = {contrast1.psiHat.toFixed(2)}
              </div>
            )}
          </div>

          {/* Orthogonality badge */}
          <div style={{ textAlign: 'center' }}>
            <span className={`orthogonality-badge ${orthogonality.isOrthogonal ? 'orthogonal' : 'non-orthogonal'}`}>
              {orthogonality.isOrthogonal ? '⊥' : '∦'}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Σc·d = {orthogonality.dotProduct}
            </div>
          </div>

          {/* Contrast 2 */}
          <div style={{
            padding: 'var(--spacing-sm)',
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid #8b5cf6',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#8b5cf6', textAlign: 'center', marginBottom: '4px' }}>
              ψ₂ [{weights2.join(', ')}]
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {GROUP_LABELS.map((_, i) => (
                <input key={i} type="number" className="contrast-weight-input"
                  style={{ width: '50px', fontSize: '0.875rem' }}
                  value={weights2[i]}
                  onChange={(e) => handleWeight2Change(i, e.target.value)} step={1} />
              ))}
            </div>
            {validation2.isValid && (
              <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#8b5cf6', marginTop: '4px' }}>
                ψ&#770; = {contrast2.psiHat.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Full ANOVA table with contrast rows */}
        <table className="anova-table" style={{ marginTop: 'var(--spacing-lg)' }}>
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
              <td>Between (A)</td>
              <td>{anova.ssBetween.toFixed(2)}</td>
              <td>{anova.dfBetween}</td>
              <td>{anova.msBetween.toFixed(2)}</td>
              <td style={{ fontWeight: 600, color: omnibusSignificant ? 'var(--accent)' : 'var(--text-primary)' }}>
                {anova.fStatistic.toFixed(3)}
              </td>
              <td style={{ color: omnibusSignificant ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {anova.pValue < 0.001 ? '< .001' : anova.pValue.toFixed(3)}
              </td>
            </tr>
            {validation1.isValid && (
              <tr className="contrast-row">
                <td style={{ paddingLeft: 'var(--spacing-lg)' }}>ψ₁ [{weights1.join(', ')}]</td>
                <td>{contrast1.ssContrast.toFixed(2)}</td>
                <td>1</td>
                <td>{contrast1.msContrast.toFixed(2)}</td>
                <td style={{ fontWeight: 600, color: contrast1Significant ? '#4361ee' : 'var(--text-primary)' }}>
                  {contrast1.fStatistic.toFixed(3)}
                </td>
                <td style={{ color: contrast1Significant ? '#4361ee' : 'var(--text-secondary)' }}>
                  {contrast1.pValue < 0.001 ? '< .001' : contrast1.pValue.toFixed(3)}
                </td>
              </tr>
            )}
            {validation2.isValid && (
              <tr className="contrast-row-2">
                <td style={{ paddingLeft: 'var(--spacing-lg)' }}>ψ₂ [{weights2.join(', ')}]</td>
                <td>{contrast2.ssContrast.toFixed(2)}</td>
                <td>1</td>
                <td>{contrast2.msContrast.toFixed(2)}</td>
                <td style={{ fontWeight: 600, color: contrast2Significant ? '#8b5cf6' : 'var(--text-primary)' }}>
                  {contrast2.fStatistic.toFixed(3)}
                </td>
                <td style={{ color: contrast2Significant ? '#8b5cf6' : 'var(--text-secondary)' }}>
                  {contrast2.pValue < 0.001 ? '< .001' : contrast2.pValue.toFixed(3)}
                </td>
              </tr>
            )}
            <tr>
              <td>Within (S/A)</td>
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

        {/* SS Partition Bar */}
        {validation1.isValid && validation2.isValid && (
          <>
            <div className="ss-partition-bar" style={{ marginTop: 'var(--spacing-md)' }}>
              <div className="ss-partition-segment contrast-1" style={{ width: `${ssPartition.ss1Pct}%` }}>
                {ssPartition.ss1Pct > 12 ? 'ψ₁' : ''}
              </div>
              <div className="ss-partition-segment contrast-2" style={{ width: `${ssPartition.ss2Pct}%` }}>
                {ssPartition.ss2Pct > 12 ? 'ψ₂' : ''}
              </div>
              {ssPartition.remainderPct > 0.5 && (
                <div className="ss-partition-segment remainder" style={{ width: `${ssPartition.remainderPct}%` }} />
              )}
            </div>
            <div className="ss-partition-legend">
              <div className="ss-partition-legend-item">
                <div className="ss-partition-legend-swatch" style={{ background: '#4361ee' }} />
                SS<sub>ψ₁</sub> = {contrast1.ssContrast.toFixed(1)}
              </div>
              <div className="ss-partition-legend-item">
                <div className="ss-partition-legend-swatch" style={{ background: '#8b5cf6' }} />
                SS<sub>ψ₂</sub> = {contrast2.ssContrast.toFixed(1)}
              </div>
              {orthogonality.isOrthogonal && (
                <div className="ss-partition-legend-item" style={{ color: '#10b981', fontWeight: 600 }}>
                  Sum = {(contrast1.ssContrast + contrast2.ssContrast).toFixed(1)} ≈ SS<sub>A</sub>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Key takeaways */}
      <h3>Key Takeaways</h3>

      <ul className="takeaways-list">
        <li>
          <strong>A contrast is a weighted comparison.</strong> It encodes a specific research
          question as weights on group means, with the constraint that weights sum to zero.
        </li>
        <li>
          <strong>Every contrast has df = 1.</strong> This concentrates variance into a single
          degree of freedom, making the test more powerful than the omnibus F when the contrast
          matches the true pattern.
        </li>
        <li>
          <strong>Orthogonal contrasts are independent.</strong> Their SS values partition SS<sub>A</sub>{' '}
          without overlap. With <em>k</em> groups, at most <em>k</em> - 1 orthogonal contrasts exist.
        </li>
        <li>
          <strong>Non-orthogonal contrasts overlap but are still valid.</strong> Each individual
          test is correct; the issue is that they partially address the same variance.
        </li>
        <li>
          <strong>Planned contrasts do not require a significant omnibus F.</strong> They test
          specific a priori hypotheses directly, without a "gatekeeper" test.
        </li>
        <li>
          <strong>The error term is the same.</strong> Contrasts use MS<sub>S/A</sub> from the
          overall ANOVA as the denominator, just like the omnibus F.
        </li>
      </ul>

      <p className="intro-text">
        In the next module, we move from categorical group comparisons to continuous predictors.
        When a moderator is measured on a continuous scale, we use <strong>spotlight analysis</strong> and{' '}
        <strong>floodlight analysis</strong> to probe interactions -- conceptual cousins of the
        contrasts you have just learned.
      </p>
    </div>
  );
}
