import { useState, useMemo } from 'react';
import {
  computeContrast,
  validateContrastWeights,
  calculateGroupStatistics,
} from '../../../utils/statistics';

const GROUP_LABELS = ['CBT', 'Behavioral', 'Wait-list'];
const GROUP_COLORS = ['#4361ee', '#f4a261', '#e63946'];

const PRESETS: { label: string; weights: number[] }[] = [
  { label: 'Therapy vs. Control', weights: [1, 1, -2] },
  { label: 'CBT vs. Behavioral', weights: [1, -1, 0] },
  { label: 'Custom', weights: [0, 0, 0] },
];

export default function DefiningContrasts() {
  const [groupMeans, setGroupMeans] = useState([85, 79, 68]);
  const [withinSD] = useState(12);
  const [sampleSize] = useState(15);
  const [weights, setWeights] = useState([1, 1, -2]);
  const [selectedPreset, setSelectedPreset] = useState(0);

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
      generateSeededNormal(sampleSize, groupMeans[i], withinSD, (i + 1) * 1000)
    );
  }, [groupMeans, withinSD, sampleSize]);

  const stats = useMemo(() => calculateGroupStatistics(groups), [groups]);
  const observedMeans = stats.means;

  const validation = useMemo(() => validateContrastWeights(weights), [weights]);
  const psiHat = useMemo(
    () => computeContrast(weights, observedMeans),
    [weights, observedMeans]
  );

  const updateGroupMean = (index: number, value: number) => {
    setGroupMeans((prev) => {
      const newMeans = [...prev];
      newMeans[index] = value;
      return newMeans;
    });
  };

  const handlePresetChange = (presetIndex: number) => {
    setSelectedPreset(presetIndex);
    setWeights([...PRESETS[presetIndex].weights]);
  };

  const handleWeightChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setWeights((prev) => {
      const newWeights = [...prev];
      newWeights[index] = isNaN(parsed) ? 0 : parsed;
      return newWeights;
    });
    setSelectedPreset(2); // Switch to Custom
  };

  // Generate narrative for current contrast
  const narrative = useMemo(() => {
    const w = weights;
    const positive = w.map((c, i) => ({ c, label: GROUP_LABELS[i] })).filter((d) => d.c > 0);
    const negative = w.map((c, i) => ({ c, label: GROUP_LABELS[i] })).filter((d) => d.c < 0);
    const zero = w.map((c, i) => ({ c, label: GROUP_LABELS[i] })).filter((d) => d.c === 0);

    if (positive.length === 0 && negative.length === 0) {
      return 'All weights are zero -- this contrast does not compare anything.';
    }

    if (!validation.isValid) {
      return `The weights sum to ${validation.sum.toFixed(1)}, not zero. This is not a valid contrast.`;
    }

    const posNames = positive.map((d) => d.label).join(' and ');
    const negNames = negative.map((d) => d.label).join(' and ');
    const zeroNote =
      zero.length > 0 ? ` ${zero.map((d) => d.label).join(' and ')} ${zero.length === 1 ? 'is' : 'are'} excluded from this comparison.` : '';

    return `This contrast compares the ${posNames} group${positive.length > 1 ? 's' : ''} (positive weights) against the ${negNames} group${negative.length > 1 ? 's' : ''} (negative weights).${zeroNote} The estimated contrast value is ψ̂ = ${psiHat.toFixed(2)}.`;
  }, [weights, validation, psiHat]);

  // SVG dimensions for bar chart
  const width = 500;
  const height = 280;
  const margin = { top: 30, right: 20, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const barData = useMemo(() => {
    const yMin = Math.min(...observedMeans) - 15;
    const yMax = Math.max(...observedMeans) + 10;
    const yScale = (y: number) => plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;
    const barWidth = plotWidth / 3 * 0.6;
    const barGap = plotWidth / 3;

    return {
      yScale,
      yMin,
      yMax,
      barWidth,
      barGap,
      bars: observedMeans.map((m, i) => ({
        x: barGap * i + barGap / 2 - barWidth / 2,
        y: yScale(m),
        height: yScale(yMin) - yScale(m),
        mean: m,
      })),
      baselineY: yScale(yMin),
    };
  }, [observedMeans, plotWidth, plotHeight]);

  return (
    <div className="section-intro">
      <h2>Defining a Contrast</h2>

      <p className="intro-text">
        A <strong>contrast</strong> is a weighted sum of group means:
      </p>

      <div className="formula-box">
        <div className="formula">
          <span className="formula-main">
            ψ&#770; = c<sub>1</sub>Y&#772;<sub>1</sub> + c<sub>2</sub>Y&#772;<sub>2</sub> + c<sub>3</sub>Y&#772;<sub>3</sub> = Σ c<sub>j</sub>Y&#772;<sub>j</sub>
          </span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
          where the weights must satisfy: Σ c<sub>j</sub> = 0
        </p>
      </div>

      <p className="intro-text">
        The zero-sum constraint is what makes a contrast a <em>comparison</em> rather than a
        weighted average. Positive weights identify one "side" of the comparison; negative
        weights identify the other. A weight of zero excludes a group from the comparison
        entirely. Each set of weights encodes a different research question.
      </p>

      <div className="viz-container">
        <h4>Contrast Builder</h4>

        {/* Data controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: 'var(--spacing-md)',
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
        </div>

        {/* Bar chart with contrast indicators */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" strokeWidth={1} />

            {/* Y-axis ticks */}
            {Array.from({ length: 5 }, (_, i) => {
              const val = barData.yMin + (i / 4) * (barData.yMax - barData.yMin);
              return (
                <g key={i} transform={`translate(0, ${barData.yScale(val)})`}>
                  <line x1={-5} y1={0} x2={plotWidth} y2={0} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />
                  <text x={-10} y={4} textAnchor="end" fontSize={11} fill="var(--text-secondary)">
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {barData.bars.map((bar, i) => (
              <g key={i}>
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={barData.barWidth}
                  height={bar.height}
                  fill={GROUP_COLORS[i]}
                  opacity={weights[i] === 0 ? 0.3 : 0.7}
                  rx={4}
                />
                {/* Weight indicator above bar */}
                <text
                  x={bar.x + barData.barWidth / 2}
                  y={bar.y - 8}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill={weights[i] > 0 ? '#4361ee' : weights[i] < 0 ? '#e63946' : 'var(--text-secondary)'}
                >
                  {weights[i] > 0 ? `+${weights[i]}` : weights[i] === 0 ? '0' : weights[i]}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {GROUP_LABELS.map((label, i) => {
              const barX = barData.bars[i].x + barData.barWidth / 2;
              return (
                <g key={`label-${i}`}>
                  <text x={barX} y={plotHeight + 20} textAnchor="middle"
                    fontSize={12} fill={GROUP_COLORS[i]} fontWeight={600}>
                    {label}
                  </text>
                  <text x={barX} y={plotHeight + 35} textAnchor="middle"
                    fontSize={10} fill="var(--text-secondary)">
                    Y&#772; = {observedMeans[i].toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Contrast weight controls — single aligned row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--spacing-md)',
          justifyContent: 'center',
          marginTop: 'var(--spacing-md)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preset</label>
            <select
              className="contrast-presets"
              value={selectedPreset}
              onChange={(e) => handlePresetChange(parseInt(e.target.value))}
              style={{ height: '36px' }}
            >
              {PRESETS.map((preset, i) => (
                <option key={i} value={i}>{preset.label}</option>
              ))}
            </select>
          </div>

          {GROUP_LABELS.map((label, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <label style={{ color: GROUP_COLORS[i], fontSize: '0.75rem', fontWeight: 600 }}>{label}</label>
              <input
                type="number"
                className={`contrast-weight-input ${!validation.isValid ? 'invalid' : ''}`}
                value={weights[i]}
                onChange={(e) => handleWeightChange(i, e.target.value)}
                step={1}
                style={{ width: '56px', height: '36px', textAlign: 'center' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <span
              className={`weight-validation ${validation.isValid ? 'valid' : 'invalid'}`}
              style={{ height: '36px', display: 'flex', alignItems: 'center' }}
            >
              Σc<sub>j</sub> = {validation.sum.toFixed(0)} {validation.isValid ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Psi hat display */}
        {validation.isValid && (
          <div className="psi-hat-display">
            <div className="psi-value">ψ&#770; = {psiHat.toFixed(2)}</div>
            <div className="psi-label">Estimated contrast value</div>
          </div>
        )}

        {/* Dynamic narrative */}
        <div className="contrast-narrative">
          {narrative}
        </div>
      </div>

      <div className="key-insight">
        <h4>The Zero-Sum Constraint</h4>
        <p>
          Requiring Σc<sub>j</sub> = 0 guarantees the contrast compares groups against each
          other rather than computing a weighted average. Any set of weights that sums to zero
          defines a valid contrast -- but a <em>useful</em> contrast encodes a specific research
          question that your theory motivates.
        </p>
      </div>

    </div>
  );
}
